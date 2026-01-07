// src/lib/dashboard-api.ts
import { apiRequest } from './api';

export type DashboardOverviewResponse = {
    kpis: {
        faturamentoMes: { valor: number; trend: number };
        faturamentoDia: { valor: number; trend: number };
        lucroMes: { valor: number; trend: number };
        pedidosPendentes: number;
        ticketMedio: { valor: number; trend: number };
        clientesAtivos: { valor: number; trend: number };
    };
    graficos: {
        vendasPeriodo: {
            labels: string[];
            values: number[];
        };
        pedidosPorStatus: {
            labels: string[];
            values: number[];
        };
        topProdutos: {
            label: string;
            value: number;
        }[];
        topClientes: {
            label: string;
            value: number;
        }[];
        vendasPorTipo: {
            labels: string[];
            values: number[];
        };
        vendasPorEstado: {
            estado: string;
            total: number;
            clientes: number;  // ✅ Adicionado
        }[];
    };
};

export function getDashboardOverview() {
    return apiRequest("/dashboard/overview");
}