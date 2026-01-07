import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusPedido } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getOverview() {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioDia = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    );

    const statusValidos = {
      in: [StatusPedido.PAGO, StatusPedido.CONCLUIDO],
    };

    const [
      faturamentoMes,
      faturamentoDia,
      ticketMedio,
      pedidosPendentes,
      clientesAtivos,
      lucroMes,
      vendasPeriodo,
      pedidosPorStatus,
      topProdutos,
      topClientes,
      vendasPorTipo,
      vendasPorEstado,
    ] = await Promise.all([
      // KPIs com trends
      this.faturamentoMesComTrend(inicioMes),
      this.faturamentoDiaComTrend(inicioDia),
      this.ticketMedioComTrend(statusValidos, inicioMes),
      this.pedidosPendentes(),
      this.clientesAtivosComTrend(),
      this.lucroMesComTrend(inicioMes),

      // Gráficos
      this.vendasPorPeriodo(30),
      this.pedidosPorStatus(),
      this.topProdutos(),
      this.topClientes(),
      this.vendasPorTipoProduto(),
      this.vendasPorEstado(),
    ]);

    return {
      kpis: {
        faturamentoMes,
        faturamentoDia,
        lucroMes,
        pedidosPendentes,
        ticketMedio,
        clientesAtivos,
      },
      graficos: {
        vendasPeriodo,
        pedidosPorStatus,
        topProdutos,
        topClientes,
        vendasPorTipo,
        vendasPorEstado,
      },
    };
  }

  // =========================
  // KPIs COM TRENDS
  // =========================

  private calcularTrend(atual: number, anterior: number): number {
    if (anterior === 0) return 0;
    return Number((((atual - anterior) / anterior) * 100).toFixed(1));
  }

  async faturamentoMesComTrend(inicioMes: Date) {
    // Mês atual
    const mesAtual = await this.prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['PAGO', 'CONCLUIDO'] },
        createdAt: { gte: inicioMes },
      },
    });

    // Mês anterior
    const inicioMesAnterior = new Date(inicioMes);
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
    
    const mesAnterior = await this.prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['PAGO', 'CONCLUIDO'] },
        createdAt: { 
          gte: inicioMesAnterior,
          lt: inicioMes 
        },
      },
    });

    const atual = Number(mesAtual._sum.total ?? 0);
    const anterior = Number(mesAnterior._sum.total ?? 0);

    return {
      valor: atual,
      trend: this.calcularTrend(atual, anterior),
    };
  }

  async faturamentoDiaComTrend(inicioDia: Date) {
    // Dia atual
    const diaAtual = await this.prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['PAGO', 'CONCLUIDO'] },
        createdAt: { gte: inicioDia },
      },
    });

    // Dia anterior
    const inicioDiaAnterior = new Date(inicioDia);
    inicioDiaAnterior.setDate(inicioDiaAnterior.getDate() - 1);
    
    const fimDiaAnterior = new Date(inicioDia);

    const diaAnterior = await this.prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['PAGO', 'CONCLUIDO'] },
        createdAt: { 
          gte: inicioDiaAnterior,
          lt: fimDiaAnterior 
        },
      },
    });

    const atual = Number(diaAtual._sum.total ?? 0);
    const anterior = Number(diaAnterior._sum.total ?? 0);

    return {
      valor: atual,
      trend: this.calcularTrend(atual, anterior),
    };
  }

  async ticketMedioComTrend(statusValidos, inicioMes: Date) {
    // Ticket médio do mês atual
    const mesAtual = await this.prisma.pedido.aggregate({
      _avg: { total: true },
      where: { 
        status: statusValidos,
        createdAt: { gte: inicioMes },
      },
    });

    // Ticket médio do mês anterior
    const inicioMesAnterior = new Date(inicioMes);
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

    const mesAnterior = await this.prisma.pedido.aggregate({
      _avg: { total: true },
      where: { 
        status: statusValidos,
        createdAt: { 
          gte: inicioMesAnterior,
          lt: inicioMes 
        },
      },
    });

    const atual = Number(mesAtual._avg.total ?? 0);
    const anterior = Number(mesAnterior._avg.total ?? 0);

    return {
      valor: atual,
      trend: this.calcularTrend(atual, anterior),
    };
  }

  async pedidosPendentes() {
    return this.prisma.pedido.count({
      where: { status: 'PENDENTE' },
    });
  }

  async clientesAtivosComTrend() {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAnterior = new Date(inicioMes);
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

    // Clientes ativos totais
    const total = await this.prisma.cliente.count({
      where: { status: 'ATIVO' },
    });

    // Novos clientes este mês
    const novosMesAtual = await this.prisma.cliente.count({
      where: {
        status: 'ATIVO',
        createdAt: { gte: inicioMes },
      },
    });

    // Novos clientes mês anterior
    const novosMesAnterior = await this.prisma.cliente.count({
      where: {
        status: 'ATIVO',
        createdAt: {
          gte: inicioMesAnterior,
          lt: inicioMes,
        },
      },
    });

    return {
      valor: total,
      trend: this.calcularTrend(novosMesAtual, novosMesAnterior),
    };
  }

  async lucroMesComTrend(inicioMes: Date) {
    // Lucro do mês atual
    const itensMesAtual = await this.prisma.pedidoItem.findMany({
      where: {
        pedido: {
          status: { in: ['PAGO', 'CONCLUIDO'] },
          createdAt: { gte: inicioMes },
        },
      },
      include: {
        produto: true,
      },
    });

    const lucroAtual = itensMesAtual.reduce((total, item) => {
      const custo = Number(item.produto.custoUnitario ?? 0);
      const venda = Number(item.precoUnit);
      return total + (venda - custo) * item.quantidade;
    }, 0);

    // Lucro do mês anterior
    const inicioMesAnterior = new Date(inicioMes);
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

    const itensMesAnterior = await this.prisma.pedidoItem.findMany({
      where: {
        pedido: {
          status: { in: ['PAGO', 'CONCLUIDO'] },
          createdAt: {
            gte: inicioMesAnterior,
            lt: inicioMes,
          },
        },
      },
      include: {
        produto: true,
      },
    });

    const lucroAnterior = itensMesAnterior.reduce((total, item) => {
      const custo = Number(item.produto.custoUnitario ?? 0);
      const venda = Number(item.precoUnit);
      return total + (venda - custo) * item.quantidade;
    }, 0);

    return {
      valor: lucroAtual,
      trend: this.calcularTrend(lucroAtual, lucroAnterior),
    };
  }

  // =========================
  // GRÁFICOS
  // =========================

  async vendasPorPeriodo(dias: number) {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);

    const pedidos = await this.prisma.pedido.findMany({
      where: {
        status: { in: ['PAGO', 'CONCLUIDO'] },
        createdAt: { gte: inicio },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    // Agrupamento por dia (backend)
    const mapa = new Map<string, number>();

    pedidos.forEach(p => {
      const dia = p.createdAt.toISOString().slice(0, 10);
      mapa.set(dia, (mapa.get(dia) ?? 0) + Number(p.total));
    });

    return {
      labels: Array.from(mapa.keys()),
      values: Array.from(mapa.values()),
    };
  }

  async pedidosPorStatus() {
    const result = await this.prisma.pedido.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return {
      labels: result.map(r => r.status),
      values: result.map(r => r._count._all),
    };
  }

  async topProdutos() {
    const result = await this.prisma.pedidoItem.groupBy({
      by: ['produtoId'],
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5,
    });

    const produtos = await this.prisma.produto.findMany({
      where: { id: { in: result.map(r => r.produtoId) } },
    });

    return result.map(r => {
      const produto = produtos.find(p => p.id === r.produtoId);
      return {
        label: produto?.nome ?? 'Desconhecido',
        value: r._sum.quantidade ?? 0,
      };
    });
  }

  async topClientes() {
    const pedidos = await this.prisma.pedido.groupBy({
      by: ['clienteId'],
      _sum: { total: true },
      where: { status: { in: ['PAGO', 'CONCLUIDO'] } },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });

    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: pedidos.map(p => p.clienteId) } },
    });

    return pedidos.map(p => {
      const cliente = clientes.find(c => c.id === p.clienteId);
      return {
        label: cliente?.nome ?? 'Desconhecido',
        value: Number(p._sum.total ?? 0),
      };
    });
  }

  async vendasPorTipoProduto() {
    const itens = await this.prisma.pedidoItem.findMany({
      where: {
        pedido: { status: { in: ['PAGO', 'CONCLUIDO'] } },
      },
      include: { produto: true },
    });

    const mapa = {
      CAFE: 0,
      ACESSORIO: 0,
      COMBO: 0,
    };

    itens.forEach(i => {
      mapa[i.produto.tipoProduto] += i.quantidade;
    });

    return {
      labels: Object.keys(mapa),
      values: Object.values(mapa),
    };
  }

  private extrairEstado(endereco: string): string {
    if (!endereco) return 'OUTRO';

    // Captura padrão /UF (ex: /SP)
    const match = endereco.match(/\/([A-Z]{2})\b/);
    return match ? match[1] : 'OUTRO';
  }

  private extrairCidade(endereco: string): string {
    if (!endereco) return 'DESCONHECIDA';

    /**
     * Estratégia:
     * Pega o trecho antes de /UF
     * Exemplo:
     * "Espírito Santo do Pinhal/SP"
     */
    const match = endereco.match(/-\s*([^/-]+)\/[A-Z]{2}/);
    return match ? match[1].trim() : 'DESCONHECIDA';
  }

  async vendasPorEstado() {
    const pedidos = await this.prisma.pedido.findMany({
      where: { status: { in: ['PAGO', 'CONCLUIDO'] } },
      include: { cliente: true },
    });

    // Mapas para agregação
    const mapaVendas = new Map<string, number>();
    const mapaClientes = new Map<string, Set<number>>();

    pedidos.forEach(p => {
      const estado = this.extrairEstado(p.cliente.endereco);
      
      // Agregar vendas
      mapaVendas.set(estado, (mapaVendas.get(estado) ?? 0) + Number(p.total));
      
      // Agregar clientes únicos
      if (!mapaClientes.has(estado)) {
        mapaClientes.set(estado, new Set());
      }
      mapaClientes.get(estado)!.add(p.clienteId);
    });

    // Combinar os dados
    return Array.from(mapaVendas.entries())
      .filter(([estado]) => estado !== 'OUTRO')
      .map(([estado, total]) => ({
        estado,
        total,
        clientes: mapaClientes.get(estado)?.size ?? 0,
      }));
  }
}