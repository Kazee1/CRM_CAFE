import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RelatorioService {
    constructor(private prisma: PrismaService) { }

    async relatorio_pedidos(periodo: number) {
        // Data final = hoje no fim do dia
        const dataFinal = new Date();
        dataFinal.setHours(23, 59, 59, 999);

        // Data inicial = início do dia (periodo dias atrás)
        const dataInicial = new Date(dataFinal);
        dataInicial.setDate(dataInicial.getDate() - periodo);
        dataInicial.setHours(0, 0, 0, 0);

        console.log({
            periodo,
            dataInicial: dataInicial.toISOString(),
            dataFinal: dataFinal.toISOString(),
        });

        const pedidos = await this.prisma.pedido.findMany({
            where: {
                createdAt: {
                    gte: dataInicial,
                    lte: dataFinal,
                },
            },
            select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                cliente: {
                    select: {
                        id: true,
                        nome: true,
                        tipo: true,
                        cpfCnpj: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return pedidos;
    }


    async vendas_por_produto(periodo: number) {
        const dataFinal = new Date();
        dataFinal.setHours(23, 59, 59, 999);

        // Data inicial = início do dia (periodo dias atrás)
        const dataInicial = new Date(dataFinal);
        dataInicial.setDate(dataInicial.getDate() - periodo);
        dataInicial.setHours(0, 0, 0, 0);

        const vendas = await this.prisma.pedidoItem.groupBy({
            by: ['produtoId'],
            where: {
                pedido: {
                    createdAt: {
                        gte: dataInicial,
                    },
                    status: {
                        not: 'CANCELADO',
                    },
                },
            },
            _sum: {
                quantidade: true,
                subtotal: true,
            },
        });

        const produtosIds = vendas.map(v => v.produtoId);

        const produtos = await this.prisma.produto.findMany({
            where: {
                id: { in: produtosIds },
            },
            select: {
                id: true,
                nome: true,
                tipoProduto: true,
            },
        });

        return vendas.map(v => {
            const produto = produtos.find(p => p.id === v.produtoId);

            return {
                produtoId: v.produtoId,
                nomeProduto: produto?.nome,
                tipoProduto: produto?.tipoProduto,
                quantidadeVendida: v._sum.quantidade ?? 0,
                receitaTotal: v._sum.subtotal ?? 0,
            };
        });
    }

    async clientes(periodo: number) {
        const dataFinal = new Date();
        dataFinal.setHours(23, 59, 59, 999);

        // Data inicial = início do dia (periodo dias atrás)
        const dataInicial = new Date(dataFinal);
        dataInicial.setDate(dataInicial.getDate() - periodo);
        dataInicial.setHours(0, 0, 0, 0);

        const clientes = await this.prisma.cliente.findMany({
            where: {
                pedidos: {
                    some: {
                        createdAt: {
                            gte: dataInicial,
                        },
                        status: {
                            not: 'CANCELADO',
                        },
                    },
                },
            },
            select: {
                id: true,
                nome: true,
                tipo: true,
                pedidos: {
                    where: {
                        createdAt: {
                            gte: dataInicial,
                        },
                        status: {
                            not: 'CANCELADO',
                        },
                    },
                    select: {
                        total: true,
                    },
                },
            },
            orderBy: {
                nome: 'asc',
            },
        });

        return clientes.map(cliente => ({
            clienteId: cliente.id,
            nome: cliente.nome,
            tipo: cliente.tipo,
            totalComprado: cliente.pedidos.reduce(
                (sum, pedido) => sum + Number(pedido.total),
                0,
            ),
            numeroPedidos: cliente.pedidos.length,
        }));
    }

    async estoque_por_periodo(periodo: number) {
        const dataFinal = new Date();
        dataFinal.setHours(23, 59, 59, 999);

        // Data inicial = início do dia (periodo dias atrás)
        const dataInicial = new Date(dataFinal);
        dataInicial.setDate(dataInicial.getDate() - periodo);
        dataInicial.setHours(0, 0, 0, 0);

        // Quantidade vendida por produto no período
        const vendas = await this.prisma.pedidoItem.groupBy({
            by: ['produtoId'],
            where: {
                pedido: {
                    createdAt: {
                        gte: dataInicial,
                    },
                    status: {
                        not: 'CANCELADO',
                    },
                },
            },
            _sum: {
                quantidade: true,
            },
        });

        const produtos = await this.prisma.produto.findMany({
            select: {
                id: true,
                nome: true,
                tipoProduto: true,
                status: true,
                estoque: true,
            },
            orderBy: {
                nome: 'asc',
            },
        });

        return produtos.map(produto => {
            const venda = vendas.find(v => v.produtoId === produto.id);
            const vendidoPeriodo = venda?._sum.quantidade ?? 0;
            const estoqueAtual = produto.estoque ?? 0;

            return {
                produtoId: produto.id,
                nome: produto.nome,
                tipoProduto: produto.tipoProduto,
                status: produto.status,
                estoqueAtual,
                vendidoPeriodo,
                estoqueNoInicioPeriodo: estoqueAtual + vendidoPeriodo,
            };
        });
    }

    async cafes_por_periodo(periodo: number) {
        const dataFinal = new Date();
        dataFinal.setHours(23, 59, 59, 999);

        // Data inicial = início do dia (periodo dias atrás)
        const dataInicial = new Date(dataFinal);
        dataInicial.setDate(dataInicial.getDate() - periodo);
        dataInicial.setHours(0, 0, 0, 0);

        const cafes = await this.prisma.cafe.findMany({
            where: {
                dataTorra: {
                    gte: dataInicial,
                },
            },
            select: {
                id: true,
                tipoCafe: true,
                pontuacaoSCA: true,
                pesoGramas: true,
                numeroLote: true,
                dataTorra: true,
                dataValidade: true,
                fornecedor: true,
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                dataTorra: 'desc',
            },
        });

        return cafes.map(cafe => ({
            cafeId: cafe.id,
            produtoId: cafe.produto.id,
            nomeProduto: cafe.produto.nome,
            statusProduto: cafe.produto.status,
            tipoCafe: cafe.tipoCafe,
            pontuacaoSCA: cafe.pontuacaoSCA,
            pesoGramas: cafe.pesoGramas,
            numeroLote: cafe.numeroLote,
            fornecedor: cafe.fornecedor,
            dataTorra: cafe.dataTorra,
            dataValidade: cafe.dataValidade,
        }));
    }
}
