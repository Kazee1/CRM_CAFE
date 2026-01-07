"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash, Plus, Search, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { getProdutos } from "@/lib/produto-request";
import { Produto } from "@/lib/produto";

type ComboItem = {
  produtoId: number;
  quantidade: number;
};

type ProdutoDisponivel = {
  id: number;
  nome: string;
  preco: number;
  custo: number;
  estoque: number;
  categoria: "Café" | "Acessório";
};

type Props = {
  value: ComboItem[];
  onChange: (items: ComboItem[]) => void;
};

export function ComboBuilder({ value, onChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<"TODOS" | "Café" | "Acessório">("TODOS");
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoDisponivel[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar produtos disponíveis
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoading(true);
        const data = await getProdutos();
        
        // Filtrar apenas Cafés e Acessórios ativos
        const produtosValidos = data
          .filter((p: Produto) => p.status === "ATIVO" && (p.tipoProduto === "CAFE" || p.tipoProduto === "ACESSORIO"))
          .map((p: Produto) => ({
            id: p.id,
            nome: p.nome,
            preco: Number(p.precoVenda),
            custo: Number(p.custoUnitario || 0),
            estoque: p.estoque ?? 0,
            categoria: p.tipoProduto === "CAFE" ? "Café" as const : "Acessório" as const,
          }));
        
        setProdutosDisponiveis(produtosValidos);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarProdutos();
  }, []);

  // Produtos com detalhes completos
  const itensCompletos = value
    .map((item) => {
      const produto = produtosDisponiveis.find((p) => p.id === item.produtoId);
      if (!produto) return null;
      return {
        ...item,
        nome: produto.nome,
        preco: produto.preco,
        custo: produto.custo,
        estoque: produto.estoque,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Calcular estoque máximo possível do combo
  const estoqueMaximoCombo = itensCompletos.length === 0 
    ? 0 
    : Math.floor(Math.min(...itensCompletos.map(item => item.estoque / item.quantidade)));

  // Calcular custo total e margem média
  const custoTotal = itensCompletos.reduce((acc, i) => acc + i.custo * i.quantidade, 0);
  const precoTotal = itensCompletos.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const margemMedia = custoTotal > 0 ? ((precoTotal - custoTotal) / custoTotal) * 100 : 0;

  const produtosFiltrados = produtosDisponiveis.filter((p) => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === "TODOS" || p.categoria === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  const adicionarProduto = (produto: ProdutoDisponivel) => {
    const existente = value.find((i) => i.produtoId === produto.id);

    if (existente) {
      onChange(
        value.map((i) =>
          i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      );
    } else {
      onChange([...value, { produtoId: produto.id, quantidade: 1 }]);
    }

    setDialogOpen(false);
    setBusca("");
    setCategoriaFiltro("TODOS");
  };

  const remover = (produtoId: number) => {
    onChange(value.filter((i) => i.produtoId !== produtoId));
  };

  const alterarQtd = (produtoId: number, qtd: number) => {
    if (qtd < 1) return;
    onChange(value.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: qtd } : i)));
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-stone-900">Itens do Combo</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {value.length} {value.length === 1 ? "produto" : "produtos"} selecionados
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" className="bg-amber-800 hover:bg-amber-900 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Selecionar Produto</DialogTitle>
              <DialogDescription>
                Escolha um produto da lista para adicionar ao combo
              </DialogDescription>
            </DialogHeader>

            {/* BUSCA + FILTRO */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <Input
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={categoriaFiltro}
                onValueChange={(value) => setCategoriaFiltro(value as typeof categoriaFiltro)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="Café">Cafés</SelectItem>
                  <SelectItem value="Acessório">Acessórios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* LISTA DE PRODUTOS */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <div className="text-center py-8 text-stone-500">Carregando produtos...</div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : (
                produtosFiltrados.map((produto) => {
                  const jaSelecionado = value.some((i) => i.produtoId === produto.id);

                  return (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => adicionarProduto(produto)}
                      className="w-full text-left p-3 rounded-lg border border-stone-200 hover:border-amber-800 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-stone-900">{produto.nome}</p>
                          <p className="text-xs text-stone-500 mt-0.5">{produto.categoria}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-stone-900">
                            R$ {produto.preco.toFixed(2)}
                          </p>
                          {jaSelecionado && (
                            <p className="text-xs text-amber-800 font-medium">No combo</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* LISTA DE ITENS */}
      <div className="space-y-2">
        {itensCompletos.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-lg">
            <Package className="h-10 w-10 mx-auto mb-2 text-stone-400" />
            <p className="text-sm text-stone-500">Nenhum produto adicionado ao combo</p>
          </div>
        ) : (
          itensCompletos.map((item) => (
            <div
              key={item.produtoId}
              className="flex items-center gap-3 border border-stone-200 rounded-lg p-3 bg-white"
            >
              <div className="flex-1">
                <p className="font-medium text-stone-900">{item.nome}</p>
                <p className="text-sm text-stone-500">
                  R$ {item.preco.toFixed(2)} × {item.quantidade} ={" "}
                  <span className="font-medium">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-stone-300 rounded-md">
                  <button
                    type="button"
                    onClick={() => alterarQtd(item.produtoId, item.quantidade - 1)}
                    className="px-2 py-1 hover:bg-stone-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) => alterarQtd(item.produtoId, Number(e.target.value))}
                    className="w-12 text-center border-x"
                  />
                  <button
                    type="button"
                    onClick={() => alterarQtd(item.produtoId, item.quantidade + 1)}
                    className="px-2 py-1 hover:bg-stone-50"
                  >
                    +
                  </button>
                </div>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => remover(item.produtoId)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RESUMO */}
      {itensCompletos.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Custo total dos itens:</span>
            <span className="font-semibold text-stone-900">R$ {custoTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Preço total dos itens:</span>
            <span className="font-semibold text-stone-900">R$ {precoTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div>
              <span className="text-sm font-medium text-amber-900">Margem média atual:</span>
              <p className="text-xs text-amber-700 mt-0.5">
                Baseada nos produtos selecionados
              </p>
            </div>
            <span className="text-2xl font-bold text-amber-900">
              {margemMedia.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div>
              <span className="text-sm font-medium text-blue-900">Estoque máximo possível:</span>
              <p className="text-xs text-blue-700 mt-0.5">
                Baseado nos produtos disponíveis
              </p>
            </div>
            <span className="text-2xl font-bold text-blue-900">
              {estoqueMaximoCombo}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}