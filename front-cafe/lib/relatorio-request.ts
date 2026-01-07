import { apiRequest } from "./api";

type PeriodoParams = {
  periodo?: number;
};

const withPeriodo = (base: string, params?: PeriodoParams) => {
  if (!params?.periodo) return base;
  return `${base}?periodo=${params.periodo}`;
};

export const RelatorioService = {
  /* =========================
   * PEDIDOS
   * ========================= */
  pedidos(params?: PeriodoParams) {
    return apiRequest(
      withPeriodo('/relatorio/pedidos', params),
    );
  },

  /* =========================
   * VENDAS POR PRODUTO
   * ========================= */
  vendasPorProduto(params?: PeriodoParams) {
    return apiRequest(
      withPeriodo('/relatorio/vendas-por-produto', params),
    );
  },

  /* =========================
   * CLIENTES
   * ========================= */
  clientes(params?: PeriodoParams) {
    return apiRequest(
      withPeriodo('/relatorio/clientes', params),
    );
  },

  /* =========================
   * ESTOQUE POR PERÍODO
   * ========================= */
  estoquePorPeriodo(params?: PeriodoParams) {
    return apiRequest(
      withPeriodo('/relatorio/estoque-periodo', params),
    );
  },

  /* =========================
   * CAFÉS POR PERÍODO
   * ========================= */
  cafesPorPeriodo(params?: PeriodoParams) {
    return apiRequest(
      withPeriodo('/relatorio/cafes-periodo', params),
    );
  },
};
