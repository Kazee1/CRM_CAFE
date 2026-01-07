import { Controller, Get, Query } from '@nestjs/common';
import { RelatorioService } from './relatorio.service';

@Controller('relatorio')
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) { }

  @Get('pedidos')
  async relatorio_pedidos(
    @Query('periodo') periodo: string,
  ) {
    const dias = Number(periodo) || 30;

    return this.relatorioService.relatorio_pedidos(dias);
  }

  @Get('vendas-por-produto')
  async vendas_por_produto(
    @Query('periodo') periodo: string,
  ) {
    const dias = Number(periodo) || 30;

    return this.relatorioService.vendas_por_produto(dias);
  }

  @Get('clientes')
  async clientes(
    @Query('periodo') periodo: string,
  ) {
    const dias = Number(periodo) || 30;

    return this.relatorioService.clientes(dias);
  }

  @Get('estoque-periodo')
  async estoque_por_periodo(
    @Query('periodo') periodo: string,
  ) {
    const dias = Number(periodo) || 30;

    return this.relatorioService.estoque_por_periodo(dias);
  }

  @Get('cafes-periodo')
  async cafes_por_periodo(
    
    @Query('periodo') periodo: string,
  ) {
    const dias = Number(periodo) || 30;

    return this.relatorioService.cafes_por_periodo(dias);
  }
}
