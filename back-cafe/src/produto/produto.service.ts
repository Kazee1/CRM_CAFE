import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { TipoProduto, StatusProduto } from '@prisma/client';

@Injectable()
export class ProdutoService {
  constructor(private readonly prisma: PrismaService) { }

  // =========================
  // CREATE
  // =========================
  async create(dto: CreateProdutoDto) {
    return this.prisma.$transaction(async (tx) => {
      const produto = await tx.produto.create({
        data: {
          nome: dto.nome,
          tipoProduto: dto.tipoProduto,
          precoVenda: dto.precoVenda,
          custoUnitario:
            dto.tipoProduto === TipoProduto.COMBO ? null : dto.custoUnitario,
          estoque: dto.tipoProduto === TipoProduto.COMBO ? null : dto.estoque,
          status: StatusProduto.ATIVO,
        },
      });

      // ===== CAFÉ =====
      if (dto.tipoProduto === TipoProduto.CAFE) {
        if (
          !dto.tipoCafe ||
          !dto.pesoGramas ||
          !dto.numeroLote ||
          !dto.dataTorra ||
          !dto.dataValidade ||
          !dto.fornecedor
        ) {
          throw new BadRequestException(
            'Dados obrigatórios do café não informados',
          );
        }

        await tx.cafe.create({
          data: {
            produtoId: produto.id,
            tipoCafe: dto.tipoCafe,
            pontuacaoSCA: dto.pontuacaoSCA,
            pesoGramas: dto.pesoGramas,
            numeroLote: dto.numeroLote,
            dataTorra: new Date(dto.dataTorra),
            dataValidade: new Date(dto.dataValidade),
            fornecedor: dto.fornecedor,
          },
        });
      }

      // ===== ACESSÓRIO =====
      if (dto.tipoProduto === TipoProduto.ACESSORIO) {
        await tx.acessorio.create({
          data: {
            produtoId: produto.id,
            descricao: dto.descricao,
          },
        });
      }

      // ===== COMBO =====
      if (dto.tipoProduto === TipoProduto.COMBO) {
        if (!dto.comboItens || dto.comboItens.length === 0) {
          throw new BadRequestException('Combo precisa ter ao menos um item');
        }

        await tx.comboItem.createMany({
          data: dto.comboItens.map((item) => ({
            comboId: produto.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
          })),
        });
      }

      return produto;
    });
  }

  // =========================
  // FIND ALL
  // =========================
  findAll(status?: StatusProduto) {
    return this.prisma.produto.findMany({
      where: status ? { status } : undefined,
      include: {
        cafe: true,
        acessorio: true,
        comboComoCombo: {
          include: {
            produto: true,
          },
        },
      },
    });
  }

  // =========================
  // FIND ONE
  // =========================
  findOne(id: number) {
    return this.prisma.produto.findUnique({
      where: { id },
      include: {
        cafe: true,
        acessorio: true,
        comboComoCombo: {
          include: {
            produto: true,
          },
        },
      },
    });
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: number, dto: UpdateProdutoDto) {
    return this.prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id },
        include: {
          cafe: true,
          acessorio: true,
          comboComoCombo: true,
        },
      });

      if (!produto) {
        throw new Error('Produto não encontrado');
      }

      /* =====================
         Atualiza PRODUTO BASE
      ===================== */
      await tx.produto.update({
        where: { id },
        data: {
          nome: dto.nome,
          precoVenda: dto.precoVenda,
          custoUnitario:
            produto.tipoProduto === 'COMBO'
              ? null
              : dto.custoUnitario,
          estoque:
            produto.tipoProduto === 'COMBO'
              ? null
              : dto.estoque,
        },
      });

      /* =====================
         CAFÉ
      ===================== */
      if (produto.tipoProduto === 'CAFE') {
        await tx.cafe.upsert({
          where: { produtoId: id },
          update: {
            tipoCafe: dto.tipoCafe,
            pontuacaoSCA: dto.pontuacaoSCA,
            pesoGramas: dto.pesoGramas,
            numeroLote: dto.numeroLote,
            dataTorra: dto.dataTorra
              ? new Date(dto.dataTorra)
              : undefined,
            dataValidade: dto.dataValidade
              ? new Date(dto.dataValidade)
              : undefined,
            fornecedor: dto.fornecedor,
          },
          create: {
            produtoId: id,
            tipoCafe: dto.tipoCafe!,
            pontuacaoSCA: dto.pontuacaoSCA!,
            pesoGramas: dto.pesoGramas!,
            numeroLote: dto.numeroLote!,
            dataTorra: new Date(dto.dataTorra!),
            dataValidade: new Date(dto.dataValidade!),
            fornecedor: dto.fornecedor!,
          },
        });
      }

      /* =====================
         ACESSÓRIO
      ===================== */
      if (produto.tipoProduto === 'ACESSORIO') {
        await tx.acessorio.upsert({
          where: { produtoId: id },
          update: {
            descricao: dto.descricao,
          },
          create: {
            produtoId: id,
            descricao: dto.descricao!,
          },
        });
      }

      /* =====================
         COMBO
      ===================== */
      if (produto.tipoProduto === 'COMBO') {
        if (!dto.comboItens || dto.comboItens.length === 0) {
          throw new Error('Combo precisa ter ao menos um item');
        }

        // Remove composição antiga
        await tx.comboItem.deleteMany({
          where: { comboId: id },
        });

        // Insere nova composição
        await tx.comboItem.createMany({
          data: dto.comboItens.map((item) => ({
            comboId: id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
          })),
        });
      }

      /* =====================
         RETORNO FINAL
      ===================== */
      return tx.produto.findUnique({
        where: { id },
        include: {
          cafe: true,
          acessorio: true,
          comboComoCombo: {
            include: {
              produto: true,
            },
          },
        },
      });
    });
  }

  async toggleStatus(id: number) {
  const produto = await this.prisma.produto.findUnique({
    where: { id },
    include: {
      comboComoBase: {
        include: {
          combo: true,
        },
      },
    },
  });

  if (!produto) {
    throw new Error('Produto não encontrado');
  }

  const novoStatus =
    produto.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';

  // 1️⃣ Atualiza o produto principal
  await this.prisma.produto.update({
    where: { id },
    data: { status: novoStatus },
  });

  // 2️⃣ Se for CAFÉ ou ACESSÓRIO, atualizar combos relacionados
  if (produto.tipoProduto !== 'COMBO') {
    const comboIds = produto.comboComoBase.map(
      (item) => item.comboId
    );

    if (comboIds.length > 0) {
      await this.prisma.produto.updateMany({
        where: {
          id: { in: comboIds },
        },
        data: {
          status: novoStatus,
        },
      });
    }
  }

  return { success: true };
}

  // =========================
  // DELETE
  // =========================

  async delete(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id },
        include: {
          comboComoBase: true,
        },
      });

      if (!produto) {
        throw new Error('Produto não encontrado');
      }

      /*
      ==================================================
      CASO 1 — PRODUTO É COMBO
      → remove apenas o combo
      ==================================================
      */
      if (produto.tipoProduto === 'COMBO') {
        await tx.comboItem.deleteMany({
          where: { comboId: id },
        });

        await tx.produto.delete({
          where: { id },
        });

        return { deleted: true };
      }

      /*
      ==================================================
      CASO 2 — PRODUTO É CAFÉ OU ACESSÓRIO
      → remove todos os combos que usam este produto
      → depois remove o produto
      ==================================================
      */

      // 1. IDs dos combos afetados
      const comboIds = produto.comboComoBase.map((c) => c.comboId);

      if (comboIds.length > 0) {
        // 2. Remove todos os itens desses combos
        await tx.comboItem.deleteMany({
          where: {
            comboId: { in: comboIds },
          },
        });

        // 3. Remove os combos
        await tx.produto.deleteMany({
          where: {
            id: { in: comboIds },
          },
        });
      }

      // 4. Remove vínculo específico
      if (produto.tipoProduto === 'CAFE') {
        await tx.cafe.deleteMany({
          where: { produtoId: id },
        });
      }

      if (produto.tipoProduto === 'ACESSORIO') {
        await tx.acessorio.deleteMany({
          where: { produtoId: id },
        });
      }

      // 5. Remove o produto base
      await tx.produto.delete({
        where: { id },
      });

      return { deleted: true };
    });
  }
}
