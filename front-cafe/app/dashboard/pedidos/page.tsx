"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PedidoForm } from "./pedidosSheet";
import {
  getPedidos,
  getPedidoById,
  deletePedido,
  updatePedidoStatus,
  type StatusPedido as ApiStatusPedido,
  type PedidoResumo
} from "@/lib/pedidos-request";
import { getClientes, type Cliente } from "@/lib/cliente-request";

// =====================
// Tipos
// =====================
type StatusPedido = ApiStatusPedido;

// Tipo estendido com informações completas
type Pedido = PedidoResumo & {
  clienteNome?: string;
  quantidadeItens: number;
  numeroPedido: string;
};

// =====================
// Componente Principal
// =====================
export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<number | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido | "all">("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Carregar clientes primeiro
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        const data = await getClientes();
        setClientes(data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };
    carregarClientes();
  }, []);

  // Função auxiliar para buscar nome do cliente
  const getClienteNome = (clienteId: number): string => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nome || `Cliente ${clienteId}`;
  };

  // Carregar pedidos da API com detalhes
  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const resumos = await getPedidos();

      // Buscar detalhes de cada pedido para pegar a quantidade de itens
      const pedidosComDetalhes = await Promise.all(
        resumos.map(async (resumo) => {
          try {
            const detalhes = await getPedidoById(resumo.id);

            return {
              ...resumo,
              clienteNome: getClienteNome(resumo.clienteId),
              quantidadeItens: detalhes.itens?.length || 0,
              numeroPedido: `PED-${resumo.id.toString().padStart(3, '0')}`
            };
          } catch (error) {
            console.error(`Erro ao buscar detalhes do pedido ${resumo.id}:`, error);
            return {
              ...resumo,
              clienteNome: getClienteNome(resumo.clienteId),
              quantidadeItens: 0,
              numeroPedido: `PED-${resumo.id.toString().padStart(3, '0')}`
            };
          }
        })
      );

      setPedidos(pedidosComDetalhes);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      alert("Erro ao carregar pedidos. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar pedidos quando os clientes estiverem prontos
  useEffect(() => {
    if (clientes.length > 0) {
      carregarPedidos();
    }
  }, [clientes]);

  // Atualizar nomes dos clientes quando a lista de clientes mudar
  useEffect(() => {
    if (clientes.length > 0 && pedidos.length > 0) {
      setPedidos(prev => prev.map(p => ({
        ...p,
        clienteNome: getClienteNome(p.clienteId)
      })));
    }
  }, [clientes]);

  // Filtros
  const pedidosFiltrados = pedidos.filter((p) => {
    const matchBusca =
      p.numeroPedido.toLowerCase().includes(busca.toLowerCase()) ||
      (p.clienteNome?.toLowerCase().includes(busca.toLowerCase()) || false);

    const matchStatus = statusFiltro === "all" || p.status === statusFiltro;

    let matchData = true;
    if (dataInicio || dataFim) {
      const pedidoDate = new Date(p.createdAt);

      if (dataInicio) {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        if (pedidoDate < inicio) matchData = false;
      }

      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        if (pedidoDate > fim) matchData = false;
      }
    }

    return matchBusca && matchStatus && matchData;
  });

  // Helpers
  const getStatusBadgeColor = (status: StatusPedido) => {
    switch (status) {
      case "PENDENTE":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "PAGO":
      case "EM_PREPARO":
      case "CONCLUIDO":
        return "bg-green-100 text-green-700 border-green-200";
      case "CANCELADO":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: StatusPedido) => {
    switch (status) {
      case "PENDENTE":
        return <Clock className="h-3 w-3" />;
      case "PAGO":
      case "EM_PREPARO":
      case "CONCLUIDO":
        return <CheckCircle className="h-3 w-3" />;
      case "CANCELADO":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: StatusPedido) => {
    switch (status) {
      case "PENDENTE":
        return "Pendente";
      case "PAGO":
        return "Pago";
      case "EM_PREPARO":
        return "Em Preparo";
      case "CONCLUIDO":
        return "Concluído";
      case "CANCELADO":
        return "Cancelado";
      default:
        return status;
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Handlers
  const handleNovoClick = () => {
    setPedidoSelecionado(null);
    setSheetOpen(true);
  };

  const handleEditClick = (pedidoId: number) => {
    setPedidoSelecionado(pedidoId);
    setSheetOpen(true);
  };

  const handleDelete = async (pedido: Pedido) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o pedido ${pedido.numeroPedido}?\n\n` +
      `⚠️ Esta ação não poderá ser desfeita.`
    );

    if (!confirmacao) return;

    try {
      await deletePedido(pedido.id);
      setPedidos(pedidos.filter(p => p.id !== pedido.id));
      alert("Pedido excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      alert("Erro ao excluir pedido. Tente novamente.");
    }
  };

  const handleChangeStatus = async (id: number, status: StatusPedido) => {
    try {
      await updatePedidoStatus(id, status);
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setPedidoSelecionado(null);
    carregarPedidos();
  };

  // No início do seu componente, adicione estes estados:
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  // Calcule os itens da página atual
  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(pedidosFiltrados.length / itensPorPagina);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Pedidos</h1>
            <p className="mt-1 text-sm text-stone-600">
              Gerencie todos os pedidos da empresa
            </p>
          </div>

          <Button
            className="bg-amber-800 hover:bg-amber-900 text-white"
            onClick={handleNovoClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-600" />
            <Input
              placeholder="Buscar por número ou cliente"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 text-stone-900 placeholder:text-stone-500"
            />
          </div>

          <Select
            value={statusFiltro}
            onValueChange={(v) => setStatusFiltro(v as typeof statusFiltro)}
          >
            <SelectTrigger className="bg-white text-black border border-black">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border border-black">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="EM_PREPARO">Em Preparo</SelectItem>
              <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="text-stone-900"
            placeholder="Data início"
          />

          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="text-stone-900"
            placeholder="Data fim"
          />
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <p className="text-sm text-stone-600">Total de Pedidos</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{pedidosFiltrados.length}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {pedidosFiltrados.filter(p => p.status === "PENDENTE").length}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Confirmados</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {pedidosFiltrados.filter(p => p.status === "CONCLUIDO").length}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-700">Total em Vendas</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">
            R${" "}
            {pedidosFiltrados
              .reduce((sum, p) => sum + Number(p.total || 0), 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* TABELA */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Número</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Cliente</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Itens</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Total</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Data</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-stone-900">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-stone-500">
                  Carregando pedidos...
                </td>
              </tr>
            ) : pedidosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-stone-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido encontrado</p>
                </td>
              </tr>
            ) : (
              pedidosPaginados.map((pedido) => (
                <tr
                  key={pedido.id}
                  className="border-b last:border-b-0 hover:bg-stone-50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-stone-900">
                    {pedido.numeroPedido}
                  </td>

                  <td className="py-3 px-4 text-stone-900">
                    {pedido.clienteNome || `Cliente ${pedido.clienteId}`}
                  </td>

                  <td className="py-3 px-4 text-stone-900">
                    {pedido.quantidadeItens} {pedido.quantidadeItens === 1 ? "item" : "itens"}
                  </td>

                  <td className="py-3 px-4 font-semibold text-stone-900">
                    R$ {Number(pedido.total).toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-stone-600">
                    {formatDate(pedido.createdAt)}
                  </td>

                  <td className="py-3 px-4">
                    <Select
                      value={pedido.status}
                      onValueChange={(newStatus) => {
                        handleChangeStatus(pedido.id, newStatus as StatusPedido);
                      }}
                    >
                      <SelectTrigger
                        className={`w-36 h-8 border ${getStatusBadgeColor(pedido.status)}`}
                      >
                        <SelectValue>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(pedido.status)}
                            <span className="text-xs font-medium">{getStatusLabel(pedido.status)}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-stone-200">
                        <SelectItem value="PENDENTE">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="PAGO">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            Pago
                          </div>
                        </SelectItem>
                        <SelectItem value="EM_PREPARO">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            Em Preparo
                          </div>
                        </SelectItem>
                        <SelectItem value="CONCLUIDO">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            Concluído
                          </div>
                        </SelectItem>
                        <SelectItem value="CANCELADO">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-3 w-3" />
                            Cancelado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(pedido.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pedido.status === "CONCLUIDO"}
                        onClick={() => handleDelete(pedido)}
                        className={`
    ${pedido.status === "CONCLUIDO"
                            ? "text-stone-400 cursor-not-allowed"
                            : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          }
  `}
                        title={
                          pedido.status === "CONCLUIDO"
                            ? "Pedidos concluídos não podem ser excluídos"
                            : "Excluir pedido"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* PAGINAÇÃO */}
        {!loading && pedidosFiltrados.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-stone-50">
            <div className="text-sm text-stone-600">
              Mostrando {indexPrimeiro + 1} a {Math.min(indexUltimo, pedidosFiltrados.length)} de {pedidosFiltrados.length} pedidos
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-stone-600">
                Página {paginaAtual} de {totalPaginas}
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {pedidoSelecionado ? "Editar Pedido" : "Novo Pedido"}
            </SheetTitle>
            <SheetDescription>
              {pedidoSelecionado
                ? "Altere as informações do pedido e clique em salvar"
                : "Preencha os campos abaixo para criar um novo pedido"}
            </SheetDescription>
          </SheetHeader>

          <PedidoForm
            pedidoSelecionado={pedidoSelecionado}
            onClose={handleSheetClose}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}