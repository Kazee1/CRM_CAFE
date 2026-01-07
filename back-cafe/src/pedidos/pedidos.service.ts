import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreatePedidoDto } from "./dto/create-pedido.dto";
import { UpdatePedidoDto } from "./dto/update-pedido.dto";


import {
    Prisma,
    Produto,
    ComboItem,
    StatusPedido,
} from "@prisma/client";

@Injectable()
export class PedidoService {
    constructor(private readonly prisma: PrismaService) { }

    /* ==========================
       ESTOQUE
    ========================== */

    private async baixarEstoque(
        prisma: Prisma.TransactionClient,
        produto: Produto & { comboComoCombo: ComboItem[] },
        quantidade: number,
    ) {
        // 🔹 PRODUTO NORMAL
        if (produto.tipoProduto !== "COMBO") {
            if (produto.estoque === null || produto.estoque < quantidade) {
                throw new BadRequestException(
                    `Estoque insuficiente para ${produto.nome}`,
                );
            }

            const atualizado = await prisma.produto.update({
                where: { id: produto.id },
                data: {
                    estoque: {
                        decrement: quantidade,
                    },
                },
            });

            // 🔒 zerou → inativa
            if (atualizado.estoque === 0) {
                await prisma.produto.update({
                    where: { id: produto.id },
                    data: { status: "INATIVO" },
                });
            }

            return;
        }

        // 🔹 COMBO → baixa estoque dos itens
        for (const item of produto.comboComoCombo) {
            const qtdTotal = item.quantidade * quantidade;

            const produtoBase = await prisma.produto.findUnique({
                where: { id: item.produtoId },
            });

            if (
                !produtoBase ||
                produtoBase.estoque === null ||
                produtoBase.estoque < qtdTotal
            ) {
                throw new BadRequestException(
                    `Estoque insuficiente para item do combo`,
                );
            }

            const atualizado = await prisma.produto.update({
                where: { id: produtoBase.id },
                data: {
                    estoque: {
                        decrement: qtdTotal,
                    },
                },
            });

            if (atualizado.estoque === 0) {
                await prisma.produto.update({
                    where: { id: produtoBase.id },
                    data: { status: "INATIVO" },
                });
            }
        }
    }

    private async validarEstoquePedido(
        prisma: Prisma.TransactionClient,
        pedidoId: number,
    ) {
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: {
                itens: {
                    include: {
                        produto: {
                            include: { comboComoCombo: true },
                        },
                    },
                },
            },
        });

        if (!pedido) {
            throw new NotFoundException("Pedido não encontrado");
        }

        for (const item of pedido.itens) {
            const produto = item.produto;

            // 🔹 PRODUTO NORMAL
            if (produto.tipoProduto !== "COMBO") {
                if (produto.estoque === null || produto.estoque < 0) {
                    throw new BadRequestException(
                        `Estoque insuficiente para ${produto.nome}`,
                    );
                }
                continue;
            }

            // 🔹 COMBO
            for (const comboItem of produto.comboComoCombo) {
                const produtoBase = await prisma.produto.findUnique({
                    where: { id: comboItem.produtoId },
                });

                if (
                    !produtoBase ||
                    produtoBase.estoque === null ||
                    produtoBase.estoque < 0
                ) {
                    throw new BadRequestException(
                        `Estoque insuficiente para item do combo`,
                    );
                }
            }
        }
    }

    private async devolverEstoque(
        prisma: Prisma.TransactionClient,
        produto: Produto & { comboComoCombo: ComboItem[] },
        quantidade: number,
    ) {
        if (produto.tipoProduto !== "COMBO") {
            await prisma.produto.update({
                where: { id: produto.id },
                data: {
                    estoque: {
                        increment: quantidade,
                    },
                },
            });
            return;
        }

        for (const item of produto.comboComoCombo) {
            const qtdTotal = item.quantidade * quantidade;

            await prisma.produto.update({
                where: { id: item.produtoId },
                data: {
                    estoque: {
                        increment: qtdTotal,
                    },
                },
            });
        }
    }

    /* ==========================
       PEDIDOS
    ========================== */

    async create(dto: CreatePedidoDto) {
        return this.prisma.$transaction(async (tx) => {
            const produtos = await tx.produto.findMany({
                where: {
                    id: { in: dto.itens.map(i => i.produtoId) },
                    status: "ATIVO",
                },
                include: {
                    comboComoCombo: true,
                },
            });

            if (produtos.length !== dto.itens.length) {
                throw new NotFoundException("Produto inválido ou inativo");
            }

            const itens: Prisma.PedidoItemCreateWithoutPedidoInput[] = [];
            let total = new Prisma.Decimal(0);

            for (const item of dto.itens) {
                const produto = produtos.find(p => p.id === item.produtoId);

                if (!produto) {
                    throw new NotFoundException(
                        `Produto ${item.produtoId} não encontrado`,
                    );
                }

                // 🔽 DESCONTAR ESTOQUE
                await this.baixarEstoque(tx, produto, item.quantidade);

                const subtotal = produto.precoVenda.mul(item.quantidade);

                itens.push({
                    produto: {
                        connect: { id: produto.id },
                    },
                    quantidade: item.quantidade,
                    precoUnit: produto.precoVenda,
                    subtotal,
                });


                total = total.add(subtotal);
            }

            return tx.pedido.create({
                data: {
                    clienteId: dto.clienteId,
                    status: StatusPedido.PENDENTE,
                    total,
                    itens: {
                        create: itens,
                    },
                },
                include: {
                    itens: {
                        include: {
                            produto: true,
                        },
                    },
                },
            });
        });
    }

    async update(id: number, dto: UpdatePedidoDto) {
        return this.prisma.$transaction(async tx => {
            const pedido = await tx.pedido.findUnique({
                where: { id },
                include: {
                    itens: {
                        include: {
                            produto: {
                                include: { comboComoCombo: true },
                            },
                        },
                    },
                },
            });

            if (!pedido) {
                throw new NotFoundException("Pedido não encontrado");
            }

            if (pedido.status !== StatusPedido.PENDENTE) {
                throw new BadRequestException(
                    "Somente pedidos pendentes podem ser editados",
                );
            }

            // 🔼 DEVOLVE ESTOQUE ANTIGO
            for (const item of pedido.itens) {
                await this.devolverEstoque(
                    tx,
                    item.produto,
                    item.quantidade,
                );
            }

            // 🔥 REMOVE ITENS ANTIGOS
            await tx.pedidoItem.deleteMany({
                where: { pedidoId: id },
            });

            const produtos = await tx.produto.findMany({
                where: {
                    id: { in: dto.itens.map(i => i.produtoId) },
                    status: "ATIVO",
                },
                include: {
                    comboComoCombo: true,
                },
            });

            if (produtos.length !== dto.itens.length) {
                throw new BadRequestException("Produto inválido ou inativo");
            }

            let total = new Prisma.Decimal(0);

            const itens: Prisma.PedidoItemCreateWithoutPedidoInput[] = [];

            for (const item of dto.itens) {
                const produto = produtos.find(p => p.id === item.produtoId)!;

                // 🔽 BAIXA ESTOQUE NOVO
                await this.baixarEstoque(tx, produto, item.quantidade);

                const subtotal = produto.precoVenda.mul(item.quantidade);

                itens.push({
                    produto: { connect: { id: produto.id } },
                    quantidade: item.quantidade,
                    precoUnit: produto.precoVenda,
                    subtotal,
                });

                total = total.add(subtotal);
            }

            return tx.pedido.update({
                where: { id },
                data: {
                    clienteId: dto.clienteId,
                    total,
                    itens: {
                        create: itens,
                    },
                },
                include: {
                    itens: { include: { produto: true } },
                },
            });
        });
    }


    findAll() {
        return this.prisma.pedido.findMany({
            include: {
                cliente: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    findOne(id: number) {
        return this.prisma.pedido.findUnique({
            where: { id },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                    },
                },
            },
        });
    }

    async updateStatus(id: number, status: StatusPedido) {
        return this.prisma.$transaction(async tx => {
            const pedido = await tx.pedido.findUnique({
                where: { id },
                include: {
                    itens: {
                        include: {
                            produto: {
                                include: { comboComoCombo: true },
                            },
                        },
                    },
                },
            });

            if (!pedido) {
                throw new NotFoundException("Pedido não encontrado");
            }

            // 🛑 já está cancelado
            if (pedido.status === StatusPedido.CANCELADO) {
                return pedido;
            }

            /* ==========================
               CANCELAMENTO
            ========================== */
            if (status === StatusPedido.CANCELADO) {
                // 🔒 regra de negócio (opcional, mas recomendado)
                if (
                    pedido.status === StatusPedido.CONCLUIDO
                ) {
                    throw new BadRequestException(
                        "Pedidos concluídos não podem ser cancelados",
                    );
                }

                // 🔼 DEVOLVE ESTOQUE
                for (const item of pedido.itens) {
                    await this.devolverEstoque(
                        tx,
                        item.produto,
                        item.quantidade,
                    );
                }

                return tx.pedido.update({
                    where: { id },
                    data: { status: StatusPedido.CANCELADO },
                });
            }

            /* ==========================
               AVANÇO DE STATUS
            ========================== */
            if (pedido.status === StatusPedido.PENDENTE) {
                switch (status) {
                    case StatusPedido.PAGO:
                    case StatusPedido.EM_PREPARO:
                        await this.validarEstoquePedido(tx, id);
                        break;
                }
            }

            return tx.pedido.update({
                where: { id },
                data: { status },
            });
        });
    }


    async remove(id: number) {
        return this.prisma.$transaction(async tx => {
            const pedido = await tx.pedido.findUnique({
                where: { id },
                include: {
                    itens: {
                        include: {
                            produto: {
                                include: { comboComoCombo: true },
                            },
                        },
                    },
                },
            });

            if (!pedido) {
                throw new NotFoundException("Pedido não encontrado");
            }

            // 🔒 regra administrativa (ajuste se quiser)
            if (pedido.status === StatusPedido.CONCLUIDO) {
                throw new BadRequestException(
                    "Pedidos concluídos não podem ser removidos do sistema",
                );
            }

            for (const item of pedido.itens) {
                await this.devolverEstoque(
                    tx,
                    item.produto,
                    item.quantidade,
                );
            }

            // 🔥 REMOVE ITENS
            await tx.pedidoItem.deleteMany({
                where: { pedidoId: id },
            });

            // 🔥 REMOVE PEDIDO
            await tx.pedido.delete({
                where: { id },
            });

            return { message: "Pedido removido definitivamente" };
        });
    }

    async findByCliente(clienteId: number) {
        const pedidos = await this.prisma.pedido.findMany({
            where: { clienteId },
            orderBy: { createdAt: "desc" },
            include: {
                itens: true,
            },
        });

        return pedidos.map(pedido => ({
            id: pedido.id,
            data: pedido.createdAt,
            valor: Number(pedido.total),
            status: pedido.status,
            itens: pedido.itens.length,
        }));
    }



}

