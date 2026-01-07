"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { getProdutos, toggleProdutoStatus, deleteProduto } from "@/lib/produto-request";
import { Produto as ProdutoAPI } from "@/lib/produto";
import { Plus, Search, Edit, Power, Info, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProdutoForm } from "./produtoSheet";
import { ProdutoFormData } from "./schemas/produto.schema";

// =====================
// Tipos UI
// =====================
type Categoria = "Café" | "Acessório" | "Combo";
type Status = "Ativo" | "Inativo";

type ProdutoUI = {
  id: number;
  nome: string;
  categoria: Categoria;
  preco: number;
  custoUnitario: number;
  estoque: number;
  status: Status;
  estoqueMaximoCombo?: number; // Para combos
};

// =====================
// Conversores
// =====================
function produtoApiToUi(produto: ProdutoAPI): ProdutoUI {
  let estoque = produto.estoque ?? 0;
  let custoUnitario = Number(produto.custoUnitario ?? 0);
  let estoqueMaximoCombo: number | undefined;

  if (produto.tipoProduto === "COMBO" && produto.comboComoCombo) {
    // ===== calcular custo unitário do combo =====
    custoUnitario = produto.comboComoCombo.reduce((total, item) => {
      const custoItem = Number(item.produto.custoUnitario ?? 0);
      return total + custoItem * item.quantidade;
    }, 0);

    // ===== calcular estoque máximo do combo =====
    const estoques = produto.comboComoCombo.map(item => {
      const estoqueProduto = item.produto.estoque ?? 0;
      return Math.floor(estoqueProduto / item.quantidade);
    });

    estoqueMaximoCombo = estoques.length > 0 ? Math.min(...estoques) : 0;
    estoque = estoqueMaximoCombo;
  }

  return {
    id: produto.id,
    nome: produto.nome,
    categoria:
      produto.tipoProduto === "CAFE"
        ? "Café"
        : produto.tipoProduto === "ACESSORIO"
          ? "Acessório"
          : "Combo",
    preco: Number(produto.precoVenda),
    custoUnitario,
    estoque,
    status: produto.status === "ATIVO" ? "Ativo" : "Inativo",
    estoqueMaximoCombo,
  };
}


// Converte ISO 8601 para yyyy-MM-dd
function formatDateForInput(isoDate: string | undefined): string {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  } catch {
    return "";
  }
}

function produtoApiToForm(produto: ProdutoAPI): ProdutoFormData {
  const base = {
    id: produto.id,
    nome: produto.nome,
    tipoProduto: produto.tipoProduto,
    precoVenda: Number(produto.precoVenda),
  };

  if (produto.tipoProduto === "CAFE" && produto.cafe) {
    return {
      ...base,
      tipoProduto: "CAFE",
      estoque: produto.estoque ?? 0,
      custoUnitario: Number(produto.custoUnitario ?? 0),
      tipoCafe: produto.cafe.tipoCafe as "GRAO" | "MOIDO" | "CAPSULA",
      pontuacaoSCA: produto.cafe.pontuacaoSCA,
      pesoGramas: produto.cafe.pesoGramas,
      numeroLote: produto.cafe.numeroLote,
      dataTorra: formatDateForInput(produto.cafe.dataTorra),
      dataValidade: formatDateForInput(produto.cafe.dataValidade),
      fornecedor: produto.cafe.fornecedor,
    };
  }

  if (produto.tipoProduto === "ACESSORIO") {
    return {
      ...base,
      tipoProduto: "ACESSORIO",
      estoque: produto.estoque ?? 0,
      custoUnitario: Number(produto.custoUnitario ?? 0),
      descricao: produto.acessorio?.descricao ?? "",
    };
  }

  // COMBO
  return {
    ...base,
    tipoProduto: "COMBO",
    comboItens:
      produto.comboComoCombo?.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
      })) ?? [],
  };
}

// =====================
// Componente Principal
// =====================
export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoFormData | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");

  // Carregar produtos
  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const data = await getProdutos();
      setProdutos(data.map(produtoApiToUi));
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Filtros
  const produtosFiltrados = produtos
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((p) => (categoria === "all" ? true : p.categoria === categoria))
    .filter((p) => (status === "all" ? true : p.status === status));

  // Handlers
  const handleNovoClick = () => {
    setProdutoSelecionado(null);
    setSheetOpen(true);
  };

  const handleEditClick = async (produtoId: number) => {
    try {
      const data = await getProdutos();
      const produto = data.find((p) => p.id === produtoId);
      if (produto) {
        setProdutoSelecionado(produtoApiToForm(produto));
        setSheetOpen(true);
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
    }
  };

  const handleToggleStatus = async (produtoId: number) => {
    try {
      await toggleProdutoStatus(produtoId);
      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const handleDelete = async (produto: ProdutoUI) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o produto "${produto.nome}"?\n\n` +
      `⚠️ Esta ação não poderá ser desfeita.\n` +
      `${produto.categoria !== "Combo"
        ? "Todos os combos que usam este produto também serão excluídos."
        : ""}`
    );

    if (!confirmacao) return;

    try {
      await deleteProduto(produto.id);
      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto. Verifique se ele não está em uso.");
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setProdutoSelecionado(null);
    carregarProdutos();
  };

  // No início do seu componente, adicione estes estados:
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  // Calcule os itens da página atual
  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;
  const produtosPaginados = produtosFiltrados.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Produtos</h1>
            <p className="mt-1 text-sm text-stone-600">
              Gerencie todos os produtos vendidos pela empresa
            </p>
          </div>

          <Button
            className="bg-amber-800 hover:bg-amber-900 text-white"
            onClick={handleNovoClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-600" />
            <Input
              placeholder="Buscar por nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 text-stone-900 placeholder:text-stone-500"
            />
          </div>

          <Select value={categoria} onValueChange={(v) => setCategoria(v as typeof categoria)}>
            <SelectTrigger className="bg-white text-black border border-black">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border border-black">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Café">Café</SelectItem>
              <SelectItem value="Acessório">Acessório</SelectItem>
              <SelectItem value="Combo">Combo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="bg-white text-black border border-black">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border border-black">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABELA */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Nome</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Categoria</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Compra</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Venda</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Valor em Estoque</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Estoque</th>
              <th className="text-left py-3 px-4 font-semibold text-stone-900">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-stone-900">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-stone-500">
                  Carregando produtos...
                </td>
              </tr>
            ) : produtosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-stone-500">
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              produtosPaginados.map((produto) => (
                <tr
                  key={produto.id}
                  className="border-b last:border-b-0 hover:bg-stone-50 transition-colors"
                >
                  {/* Nome */}
                  <td className="py-3 px-4 font-medium text-stone-900">
                    {produto.nome}
                  </td>

                  {/* Categoria */}
                  <td className="py-3 px-4">
                    <Badge className="bg-stone-100 text-stone-800 border border-stone-300">
                      {produto.categoria}
                    </Badge>
                  </td>

                  {/* Compra */}
                  <td className="py-3 px-4 text-stone-900">
                    R$ {produto.custoUnitario.toFixed(2)}
                  </td>

                  {/* Venda */}
                  <td className="py-3 px-4 text-stone-900">
                    R$ {produto.preco.toFixed(2)}
                  </td>

                  {/* Valor em estoque */}
                  <td className="py-3 px-4 text-stone-900">
                    {produto.categoria === "Combo" && produto.estoqueMaximoCombo !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <span>
                          R$ {(produto.custoUnitario * produto.estoqueMaximoCombo).toFixed(2)}
                        </span>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-stone-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Valor máximo considerando os kits possíveis com o estoque atual
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <span>
                        R$ {(produto.custoUnitario * produto.estoque).toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Estoque */}
                  <td className="py-3 px-4">
                    {produto.categoria === "Combo" && produto.estoqueMaximoCombo !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        {produto.estoqueMaximoCombo <= 5 ? (
                          <Badge className="bg-red-100 text-red-700">
                            {produto.estoqueMaximoCombo}
                          </Badge>
                        ) : (
                          <span className="text-stone-900">
                            {produto.estoqueMaximoCombo}
                          </span>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-stone-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Quantidade máxima de kits possíveis com o estoque atual
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : produto.estoque <= 5 ? (
                      <Badge className="bg-red-100 text-red-700">
                        {produto.estoque}
                      </Badge>
                    ) : (
                      <span className="text-stone-900">{produto.estoque}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <Badge
                      className={
                        produto.status === "Ativo"
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-200 text-stone-700"
                      }
                    >
                      {produto.status}
                    </Badge>
                  </td>

                  {/* Ações */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(produto.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(produto.id)}
                        className="text-stone-600 hover:text-stone-800 hover:bg-stone-100"
                      >
                        <Power className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(produto)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        {!loading && produtosFiltrados.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-stone-50">
            <div className="text-sm text-stone-600">
              Mostrando {indexPrimeiro + 1} a {Math.min(indexUltimo, produtosFiltrados.length)} de {produtosFiltrados.length} pedidos
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
              {produtoSelecionado && "id" in produtoSelecionado
                ? "Editar Produto"
                : "Novo Produto"}
            </SheetTitle>
            <SheetDescription>
              {produtoSelecionado && "id" in produtoSelecionado
                ? "Altere as informações do produto e clique em salvar"
                : "Preencha os campos abaixo para criar um novo produto"}
            </SheetDescription>
          </SheetHeader>

          <ProdutoForm
            produtoSelecionado={produtoSelecionado}
            onClose={handleSheetClose}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}