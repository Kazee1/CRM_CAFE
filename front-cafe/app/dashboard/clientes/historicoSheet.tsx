"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Package, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Filter,
  X,
  MapPin,
  User,
  Phone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPedidoCliente, getPedidoById } from "@/lib/pedidos-request";

type Cliente = {
  id: number;
  nome: string;
  tipo: "FISICA" | "JURIDICA";
  cpfCnpj: string;
  email?: string;
  telefone: string;
  endereco: string;
  observacao?: string;
  status: "ATIVO" | "INATIVO";
  createdAt: string;
};

type StatusPedido = "PENDENTE" | "PAGO" | "EM_PREPARO" | "CONCLUIDO" | "CANCELADO";

type ItemPedido = {
  id: number;
  quantidade: number;
  precoUnit: number;
  subtotal: number;
  produto: {
    id: number;
    nome: string;
    categoria: string;
  };
};

type Pedido = {
  id: number;
  data: string;
  valor: number;
  status: StatusPedido;
  itens: number;
};

type PedidoDetalhado = {
  id: number;
  clienteId: number;
  status: StatusPedido;
  total: number;
  observacao?: string;
  createdAt: string;
  updatedAt: string;
  itens: ItemPedido[];
  cliente: {
    id: number;
    nome: string;
    telefone: string;
    endereco: string;
  };
};

type Props = {
  cliente: Cliente;
  onClose: () => void;
};

const STATUS_CONFIG = {
  PENDENTE: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-700",
  },
  PAGO: {
    label: "Pago",
    className: "bg-blue-100 text-blue-700",
  },
  EM_PREPARO: {
    label: "Em Preparo",
    className: "bg-orange-100 text-orange-700",
  },
  CONCLUIDO: {
    label: "Concluído",
    className: "bg-green-100 text-green-700",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700",
  },
};

export function ClienteHistorico({ cliente, onClose }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | "TODOS">("TODOS");
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoDetalhado | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  useEffect(() => {
    carregarHistorico();
  }, [cliente.id]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const data = await getPedidoCliente(cliente.id);
      setPedidos(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = filtroStatus === "TODOS" 
    ? pedidos 
    : pedidos.filter(p => p.status === filtroStatus);

  // Paginação
  const totalPaginas = Math.ceil(pedidosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indiceInicio, indiceFim);

  // Resetar página ao mudar filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus]);

  const calcularEstatisticas = () => {
    const pedidosFinalizados = pedidos.filter((p) => p.status === "CONCLUIDO");
    const totalGasto = pedidosFinalizados.reduce((acc, p) => acc + p.valor, 0);
    const totalPedidos = pedidosFinalizados.length;
    const ticketMedio = totalPedidos > 0 ? totalGasto / totalPedidos : 0;

    return { totalGasto, totalPedidos, ticketMedio };
  };

  const { totalGasto, totalPedidos, ticketMedio } = calcularEstatisticas();

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString("pt-BR");
  };

  const getStatusBadge = (status: StatusPedido) => {
    const config = STATUS_CONFIG[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const abrirDetalhesPedido = async (pedido: Pedido) => {
    try {
      setLoadingDetalhes(true);
      setDialogAberto(true);
      const detalhes = await getPedidoById(pedido.id);
      setPedidoSelecionado(detalhes);
    } catch (error) {
      console.error("Erro ao carregar detalhes do pedido:", error);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const contarPedidosPorStatus = (status: StatusPedido) => {
    return pedidos.filter(p => p.status === status).length;
  };

  return (
    <>
      <div className="space-y-6 mt-6">
        {/* INFORMAÇÕES DO CLIENTE */}
        <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">{cliente.nome}</h3>
              <Badge
                className={
                  cliente.tipo === "FISICA"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }
              >
                {cliente.tipo === "FISICA" ? "Pessoa Física" : "Pessoa Jurídica"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-stone-600">
              <div>
                <span className="font-medium">Telefone:</span> {cliente.telefone}
              </div>
              {cliente.email && (
                <div>
                  <span className="font-medium">Email:</span> {cliente.email}
                </div>
              )}
              <div className="col-span-2">
                <span className="font-medium">Endereço:</span> {cliente.endereco}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Cliente desde:</span>{" "}
                {formatarData(cliente.createdAt)}
              </div>
            </div>

            {cliente.observacao && (
              <div className="pt-2 border-t border-stone-200 mt-2">
                <span className="font-medium text-sm text-stone-700">Observações:</span>
                <p className="text-sm text-stone-600 mt-1">{cliente.observacao}</p>
              </div>
            )}
          </div>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-700" />
              <span className="text-sm font-medium text-green-900">Total Gasto</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              R$ {totalGasto.toFixed(2)}
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-blue-700" />
              <span className="text-sm font-medium text-blue-900">Pedidos</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totalPedidos}</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-700" />
              <span className="text-sm font-medium text-purple-900">Ticket Médio</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              R$ {ticketMedio.toFixed(2)}
            </p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="space-y-3 ml-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
            <Filter className="h-5 w-5 text-stone-700" />
            <h3 className="font-semibold text-stone-900">Filtrar por Status</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={filtroStatus === "TODOS" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus("TODOS")}
              className="h-9"
            >
              Todos ({pedidos.length})
            </Button>
            
            <Button
              variant={filtroStatus === "PENDENTE" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus("PENDENTE")}
              className="h-9"
            >
              Pendentes ({contarPedidosPorStatus("PENDENTE")})
            </Button>

            <Button
              variant={filtroStatus === "PAGO" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus("PAGO")}
              className="h-9"
            >
              Pagos ({contarPedidosPorStatus("PAGO")})
            </Button>

            <Button
              variant={filtroStatus === "EM_PREPARO" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus("EM_PREPARO")}
              className="h-9"
            >
              Em Preparo ({contarPedidosPorStatus("EM_PREPARO")})
            </Button>

            <Button
              variant={filtroStatus === "CONCLUIDO" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus("CONCLUIDO")}
              className="h-9"
            >
              Concluídos ({contarPedidosPorStatus("CONCLUIDO")})
            </Button>

            <Button
              variant={filtroStatus === "CANCELADO" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus("CANCELADO")}
              className="h-9"
            >
              Cancelados ({contarPedidosPorStatus("CANCELADO")})
            </Button>
          </div>
        </div>

        {/* HISTÓRICO DE PEDIDOS */}
        <div className="space-y-4 ml-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
            <Package className="h-5 w-5 text-stone-700" />
            <h3 className="font-semibold text-stone-900">Histórico de Pedidos</h3>
            {filtroStatus !== "TODOS" && (
              <span className="text-sm text-stone-500">
                ({pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "resultado" : "resultados"})
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-stone-500">
              Carregando histórico...
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-2 text-stone-400" />
              <p className="text-stone-500">
                {filtroStatus === "TODOS" 
                  ? "Nenhum pedido encontrado" 
                  : `Nenhum pedido ${STATUS_CONFIG[filtroStatus].label.toLowerCase()}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidosPaginados.map((pedido) => (
                <div
                  key={pedido.id}
                  className="p-4 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer"
                  onClick={() => abrirDetalhesPedido(pedido)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-stone-500" />
                      <span className="font-medium text-stone-900">
                        Pedido #{pedido.id}
                      </span>
                      <span className="text-sm text-stone-500">
                        {formatarData(pedido.data)}
                      </span>
                    </div>
                    {getStatusBadge(pedido.status)}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-stone-600">
                      <Package className="h-4 w-4 inline mr-1" />
                      {pedido.itens} {pedido.itens === 1 ? "item" : "itens"}
                    </div>
                    <div className="font-semibold text-stone-900">
                      R$ {pedido.valor.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAGINAÇÃO */}
        {!loading && pedidosFiltrados.length > 0 && totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <div className="text-sm text-stone-600">
              Mostrando {indiceInicio + 1} - {Math.min(indiceFim, pedidosFiltrados.length)} de {pedidosFiltrados.length} pedidos
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => {
                  // Mostrar apenas algumas páginas ao redor da atual
                  if (
                    pagina === 1 ||
                    pagina === totalPaginas ||
                    (pagina >= paginaAtual - 1 && pagina <= paginaAtual + 1)
                  ) {
                    return (
                      <Button
                        key={pagina}
                        variant={paginaAtual === pagina ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaginaAtual(pagina)}
                        className="h-9 w-9 p-0"
                      >
                        {pagina}
                      </Button>
                    );
                  } else if (
                    pagina === paginaAtual - 2 ||
                    pagina === paginaAtual + 2
                  ) {
                    return (
                      <span key={pagina} className="px-2 text-stone-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAtual === totalPaginas}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* BOTÃO FECHAR */}
        <div className="flex pt-4 border-t border-stone-200">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>

      {/* DIALOG DE DETALHES DO PEDIDO */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Pedido #{pedidoSelecionado?.id}</span>
              {pedidoSelecionado && getStatusBadge(pedidoSelecionado.status)}
            </DialogTitle>
          </DialogHeader>

          {loadingDetalhes ? (
            <div className="text-center py-8 text-stone-500">
              Carregando detalhes do pedido...
            </div>
          ) : pedidoSelecionado ? (
            <div className="space-y-6">
              {/* INFORMAÇÕES GERAIS */}
              <div className="space-y-3">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informações Gerais
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-stone-50 rounded border border-stone-200">
                    <span className="text-stone-600">Data do Pedido</span>
                    <p className="font-medium text-stone-900 mt-1">
                      {formatarDataHora(pedidoSelecionado.createdAt)}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded border border-stone-200">
                    <span className="text-stone-600">Valor Total</span>
                    <p className="font-medium text-stone-900 mt-1">
                      R$ {Number(pedidoSelecionado.total).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded border border-stone-200">
                    <span className="text-stone-600">Última Atualização</span>
                    <p className="font-medium text-stone-900 mt-1">
                      {formatarDataHora(pedidoSelecionado.updatedAt)}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded border border-stone-200">
                    <span className="text-stone-600">Total de Itens</span>
                    <p className="font-medium text-stone-900 mt-1">
                      {pedidoSelecionado.itens.length} {pedidoSelecionado.itens.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                </div>
              </div>

              {/* CLIENTE */}
              <div className="space-y-3">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h3>
                <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-stone-900">{pedidoSelecionado.cliente.nome}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <Phone className="h-4 w-4" />
                    {pedidoSelecionado.cliente.telefone}
                  </div>
                  <div className="flex items-start gap-2 text-stone-600">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{pedidoSelecionado.cliente.endereco}</span>
                  </div>
                </div>
              </div>

              {/* ITENS DO PEDIDO */}
              {pedidoSelecionado.itens && pedidoSelecionado.itens.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Itens do Pedido
                  </h3>
                  <div className="space-y-2">
                    {pedidoSelecionado.itens.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-stone-50 rounded border border-stone-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-stone-200 rounded-full font-semibold text-stone-700">
                            {item.quantidade}x
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{item.produto.nome}</p>
                            <p className="text-xs text-stone-500">{item.produto.categoria}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-stone-900">
                            R$ {Number(item.subtotal).toFixed(2)}
                          </p>
                          <p className="text-xs text-stone-500">
                            R$ {Number(item.precoUnit).toFixed(2)} cada
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* TOTAL */}
                  <div className="p-4 bg-stone-100 rounded-lg border-2 border-stone-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900">Total do Pedido:</span>
                      <span className="text-xl font-bold text-stone-900">
                        R$ {Number(pedidoSelecionado.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* OBSERVAÇÕES */}
              {pedidoSelecionado.observacao && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </h3>
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 text-sm text-stone-700">
                    {pedidoSelecionado.observacao}
                  </div>
                </div>
              )}

              {/* BOTÃO FECHAR */}
              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogAberto(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-red-500">
              Erro ao carregar detalhes do pedido
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}