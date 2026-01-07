"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    Calendar,
    Target,
    BarChart3,
    PieChart,
    MapPin,
    Award,
    TrendingDown,
    Package,
    Loader2
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getDashboardOverview, type DashboardOverviewResponse } from "@/lib/dashboard-request";
import { LucideIcon } from "lucide-react";
import InteractiveMap from "./mapinteractive";

interface KpiCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    trend?: number;
    format?: "currency" | "number";
}

const KpiCard = ({
    title,
    value,
    icon: Icon,
    trend,
    format = "currency",
}: KpiCardProps) => {
    const formatValue = (val: number) => {
        if (format === "currency") {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        }
        return val.toLocaleString('pt-BR');
    };

    return (
        <Card className="border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-stone-600 mb-1">{title}</p>
                        <h3 className="text-2xl font-bold text-stone-900">{formatValue(value)}</h3>
                        {trend && (
                            <div className="flex items-center mt-2">
                                {trend > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                                )}
                                <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {Math.abs(trend)}% vs. mês anterior
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-4 p-3 bg-amber-100 rounded-lg">
                        <Icon className="h-6 w-6 text-amber-800" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

interface LineChartData {
    labels: string[];
    values: number[];
}

const LineChart = ({ data }: { data: LineChartData }) => {
    const max = Math.max(...data.values);
    const height = 200;

    return (
        <div className="flex items-end justify-between gap-1 h-[200px] px-2">
            {data.values.map((value, index) => {
                const barHeight = (value / max) * height;

                return (
                    <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                        <div className="relative group w-full">
                            <div
                                className="w-full bg-gradient-to-t from-amber-800 to-amber-600 rounded-t transition-all hover:opacity-80 cursor-pointer"
                                style={{ height: `${barHeight}px` }}
                            />
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                <div className="text-gray-300">{data.labels[index]}</div>
                                <div className="font-semibold">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(value)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

interface ChartData {
    labels: string[];
    values: number[];
}

const DoughnutChart = ({ data }: { data: ChartData }) => {
    const total = data.values.reduce((a, b) => a + b, 0);
    const colors = ['#78350f', '#92400e', '#a16207', '#ca8a04', '#d97706'];

    return (
        <div className="flex items-center justify-center gap-8 p-4">
            <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {data.values.map((value, index) => {
                        const percentage = (value / total) * 100;
                        const prevPercentages = data.values.slice(0, index).reduce((a, b) => a + b, 0) / total * 100;
                        const circumference = 2 * Math.PI * 35;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((prevPercentages / 100) * circumference);

                        return (
                            <circle
                                key={index}
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke={colors[index]}
                                strokeWidth="15"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all hover:opacity-80"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-stone-900">{total}</p>
                        <p className="text-xs text-stone-600">Total</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {data.labels.map((label, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index] }} />
                        <span className="text-sm text-stone-700">{label}</span>
                        <span className="text-sm font-semibold text-stone-900 ml-auto">{data.values[index]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PieChartComponent = ({ data }: { data: ChartData }) => {
    const total = data.values.reduce((a, b) => a + b, 0);
    const colors = ['#78350f', '#92400e', '#a16207', '#ca8a04', '#d97706'];

    let currentAngle = 0;

    return (
        <div className="flex items-center justify-center gap-8 p-4">
            <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100">
                    {data.values.map((value, index) => {
                        const percentage = value / total;
                        const angle = percentage * 360;
                        const startAngle = currentAngle;
                        currentAngle += angle;

                        const x1 = 50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 50 + 50 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                        const y2 = 50 + 50 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                        const largeArc = angle > 180 ? 1 : 0;

                        return (
                            <path
                                key={index}
                                d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={colors[index]}
                                className="transition-all hover:opacity-80"
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="flex flex-col gap-2">
                {data.labels.map((label, index) => {
                    const percentage = ((data.values[index] / total) * 100).toFixed(1);
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index] }} />
                            <span className="text-sm text-stone-700">{label}</span>
                            <span className="text-sm font-semibold text-stone-900 ml-auto">{percentage}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface BarDataItem {
    label: string;
    value: number;
}

const HorizontalBar = ({ data, format = "number" }: { data: BarDataItem[], format?: "currency" | "number" }) => {
    const max = Math.max(...data.map(d => d.value));

    return (
        <div className="space-y-4 p-4">
            {data.map((item, index) => {
                const width = (item.value / max) * 100;
                const formatValue = format === "currency"
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)
                    : item.value.toLocaleString('pt-BR');

                return (
                    <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-amber-100 text-amber-900 font-semibold">
                                    #{index + 1}
                                </Badge>
                                <span className="font-medium text-stone-900">{item.label}</span>
                            </div>
                            <span className="font-semibold text-stone-900">{formatValue}</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-800 to-amber-600 rounded-full transition-all duration-500"
                                style={{ width: `${width}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

interface EstadoData {
    estado: string;
    total: number;
    clientes: number;
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedState, setSelectedState] = useState<EstadoData | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        carregarDashboard();
    }, []);

    const carregarDashboard = async () => {
        try {
            setLoading(true);
            const response = await getDashboardOverview();
            setData(response);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStateClick = (estado: EstadoData) => {
        setSelectedState(estado);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="rounded-xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                            <BarChart3 className="h-7 w-7 text-amber-800" />
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-stone-600">
                            Visão completa do seu negócio em tempo real
                        </p>
                    </div>
                    <Badge className="bg-amber-800 text-white px-4 py-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        Atualizado agora
                    </Badge>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-amber-800 mx-auto mb-4" />
                        <p className="text-stone-600">Carregando dashboard...</p>
                    </div>
                </div>
            ) : !data ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                        <p className="text-stone-600">Erro ao carregar os dados</p>
                    </div>
                </div>
            ) : (
                <>
                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-stone-100 p-1">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-amber-800 data-[state=active]:text-white"
                            >
                                <Target className="h-4 w-4 mr-2" />
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger
                                value="performance"
                                className="data-[state=active]:bg-amber-800 data-[state=active]:text-white"
                            >
                                <Award className="h-4 w-4 mr-2" />
                                Desempenho
                            </TabsTrigger>
                            <TabsTrigger
                                value="map"
                                className="data-[state=active]:bg-amber-800 data-[state=active]:text-white"
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                Mapa de Vendas
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <KpiCard
                                    title="Faturamento do Mês"
                                    value={data.kpis.faturamentoMes.valor}
                                    icon={DollarSign}
                                    trend={data.kpis.faturamentoMes.trend}
                                />
                                <KpiCard
                                    title="Faturamento do Dia"
                                    value={data.kpis.faturamentoDia.valor}
                                    icon={TrendingUp}
                                    trend={data.kpis.faturamentoDia.trend}
                                />
                                <KpiCard
                                    title="Lucro Estimado"
                                    value={data.kpis.lucroMes.valor}
                                    icon={Target}
                                    trend={data.kpis.lucroMes.trend}
                                />
                                <KpiCard
                                    title="Pedidos Pendentes"
                                    value={data.kpis.pedidosPendentes}
                                    icon={ShoppingCart}
                                    format="number"
                                />
                                <KpiCard
                                    title="Ticket Médio"
                                    value={data.kpis.ticketMedio.valor}
                                    icon={BarChart3}
                                    trend={data.kpis.ticketMedio.trend}
                                />
                                <KpiCard
                                    title="Clientes Ativos"
                                    value={data.kpis.clientesAtivos.valor}
                                    icon={Users}
                                    format="number"
                                    trend={data.kpis.clientesAtivos.trend}
                                />
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card className="border-stone-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-stone-900 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-amber-800" />
                                            Vendas dos Últimos 30 Dias
                                        </CardTitle>
                                        <CardDescription>Evolução do faturamento diário</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <LineChart data={data.graficos.vendasPeriodo} />
                                    </CardContent>
                                </Card>

                                <Card className="border-stone-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-stone-900 flex items-center gap-2">
                                            <Package className="h-5 w-5 text-amber-800" />
                                            Pedidos por Status
                                        </CardTitle>
                                        <CardDescription>Distribuição atual dos pedidos</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <DoughnutChart data={data.graficos.pedidosPorStatus} />
                                    </CardContent>
                                </Card>

                                <Card className="border-stone-200 shadow-sm lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-stone-900 flex items-center gap-2">
                                            <PieChart className="h-5 w-5 text-amber-800" />
                                            Vendas por Tipo de Produto
                                        </CardTitle>
                                        <CardDescription>Composição do faturamento por categoria</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <PieChartComponent data={data.graficos.vendasPorTipo} />
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="performance" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card className="border-stone-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-stone-900 flex items-center gap-2">
                                            <Award className="h-5 w-5 text-amber-800" />
                                            Top 5 Produtos Vendidos
                                        </CardTitle>
                                        <CardDescription>Ranking por quantidade vendida</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <HorizontalBar data={data.graficos.topProdutos} format="number" />
                                    </CardContent>
                                </Card>

                                <Card className="border-stone-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-stone-900 flex items-center gap-2">
                                            <Users className="h-5 w-5 text-amber-800" />
                                            Top 5 Clientes
                                        </CardTitle>
                                        <CardDescription>Ranking por valor total comprado</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <HorizontalBar data={data.graficos.topClientes} format="currency" />
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="map" className="space-y-6">
                            <Card className="border-stone-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-stone-900 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-amber-800" />
                                        Mapa Interativo de Vendas
                                    </CardTitle>
                                    <CardDescription>Clique em um estado no mapa para ver mais detalhes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <InteractiveMap 
                                        data={data.graficos.vendasPorEstado} 
                                        onStateClick={handleStateClick}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-amber-800" />
                                    {selectedState?.estado}
                                </DialogTitle>
                                <DialogDescription>
                                    Informações detalhadas sobre as vendas neste estado
                                </DialogDescription>
                            </DialogHeader>
                            {selectedState && (
                                <div className="space-y-4 py-4">
                                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                                        <span className="text-sm font-medium text-stone-700">Total de Vendas</span>
                                        <span className="text-lg font-bold text-stone-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedState.total)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                                        <span className="text-sm font-medium text-stone-700">Número de Clientes</span>
                                        <span className="text-lg font-bold text-stone-900">{selectedState.clientes}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                                        <span className="text-sm font-medium text-stone-700">Ticket Médio</span>
                                        <span className="text-lg font-bold text-stone-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedState.total / selectedState.clientes)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
}