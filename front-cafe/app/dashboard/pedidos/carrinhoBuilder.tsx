"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash, Plus, Search, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProdutos } from "@/lib/produto-request";
import { type Produto } from "@/lib/produto";

/* =======================
   TIPOS
======================= */
type CarrinhoItem = {
  produtoId: number;
  quantidade: number;
  precoUnit: number;
};

type ProdutoDisponivel = Produto & {
  precoVenda: number;
  custoUnitario?: number | null;
};

type Props = {
  value: CarrinhoItem[];
  onChange: (items: CarrinhoItem[]) => void;
};

/* =======================
   COMPONENTE
======================= */
export function CarrinhoBuilder({ value, onChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] =
    useState<"TODOS" | "CAFE" | "ACESSORIO" | "COMBO">("TODOS");
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoDisponivel[]>([]);
  const [loading, setLoading] = useState(false);
  const [estoqueErro, setEstoqueErro] = useState<{ produtoId: number; mensagem: string } | null>(null);


  const calcularEstoqueCombo = (produto: ProdutoDisponivel): number => {
    if (!produto.comboComoCombo || produto.comboComoCombo.length === 0) {
      return Infinity;
    }

    const limites = produto.comboComoCombo.map((item) => {
      const produtoBase = item.produto;
      if (!produtoBase || produtoBase.estoque == null) {
        return Infinity;
      }

      return Math.floor(produtoBase.estoque / item.quantidade);
    });

    return Math.min(...limites);
  };
  /* =======================
     CARREGAR PRODUTOS
  ======================= */
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoading(true);
        const data = await getProdutos();
        console.log(data)
        const produtosAtivos = data
          .filter((p) => p.status === "ATIVO")
          .map((p) => ({
            ...p,
            precoVenda: Number(p.precoVenda),
            custoUnitario: p.custoUnitario ? Number(p.custoUnitario) : null,
          }));

        setProdutosDisponiveis(produtosAtivos);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        alert("Erro ao carregar produtos.");
      } finally {
        setLoading(false);
      }
    };

    carregarProdutos();
  }, []);

  /* =======================
     ITENS COMPLETOS
  ======================= */
  const itensCompletos = value
    .map((item) => {
      const produto = produtosDisponiveis.find((p) => p.id === item.produtoId);
      if (!produto) return null;

      return {
        ...item,
        nome: produto.nome,
        estoque:
          produto.tipoProduto === "COMBO"
            ? calcularEstoqueCombo(produto)
            : produto.estoque ?? Infinity,
        categoria: produto.tipoProduto,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const totalCarrinho = itensCompletos.reduce(
    (acc, i) => acc + i.precoUnit * i.quantidade,
    0
  );

  /* =======================
     FILTROS
  ======================= */
  const produtosFiltrados = produtosDisponiveis.filter((p) => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === "TODOS" || p.tipoProduto === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  /* =======================
     VERIFICAR ESTOQUE
  ======================= */
  const verificarEstoque = (produtoId: number, quantidadeDesejada: number): boolean => {
    const produto = produtosDisponiveis.find((p) => p.id === produtoId);
    if (!produto) return true;

    let estoqueDisponivel: number;

    if (produto.tipoProduto === "COMBO") {
      estoqueDisponivel = calcularEstoqueCombo(produto);
    } else {
      estoqueDisponivel = produto.estoque ?? Infinity;
    }

    if (quantidadeDesejada > estoqueDisponivel) {
      setEstoqueErro({
        produtoId,
        mensagem:
          produto.tipoProduto === "COMBO"
            ? `Estoque insuficiente para o combo. Máximo disponível: ${estoqueDisponivel}`
            : `Estoque insuficiente! Disponível: ${estoqueDisponivel} unidade(s)`
      });

      setTimeout(() => setEstoqueErro(null), 5000);
      return false;
    }

    return true;
  };

  const obterEstoqueProduto = (produto: ProdutoDisponivel): number | null => {
    if (produto.tipoProduto === "COMBO") {
      const estoque = calcularEstoqueCombo(produto);
      return estoque === Infinity ? null : estoque;
    }

    return produto.estoque ?? null;
  };


  /* =======================
     AÇÕES
  ======================= */
  const adicionarProduto = (produto: ProdutoDisponivel) => {
    const existente = value.find((i) => i.produtoId === produto.id);

    if (existente) {
      const novaQuantidade = existente.quantidade + 1;

      if (!verificarEstoque(produto.id, novaQuantidade)) {
        return;
      }

      onChange(
        value.map((i) =>
          i.produtoId === produto.id
            ? { ...i, quantidade: novaQuantidade }
            : i
        )
      );
    } else {
      if (!verificarEstoque(produto.id, 1)) {
        return;
      }

      onChange([
        ...value,
        {
          produtoId: produto.id,
          quantidade: 1,
          precoUnit: Number(produto.precoVenda),
        },
      ]);
    }

    setDialogOpen(false);
    setBusca("");
    setCategoriaFiltro("TODOS");
  };

  const remover = (produtoId: number) => {
    onChange(value.filter((i) => i.produtoId !== produtoId));
    // Limpar erro se for do produto removido
    if (estoqueErro?.produtoId === produtoId) {
      setEstoqueErro(null);
    }
  };

  const alterarQtd = (produtoId: number, qtd: number) => {
    if (qtd < 1) return;

    if (!verificarEstoque(produtoId, qtd)) {
      return;
    }

    onChange(
      value.map((i) =>
        i.produtoId === produtoId ? { ...i, quantidade: qtd } : i
      )
    );
  };

  const alterarPreco = (produtoId: number, preco: number) => {
    if (preco < 0) return;
    onChange(
      value.map((i) =>
        i.produtoId === produtoId ? { ...i, precoUnit: preco } : i
      )
    );
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-stone-900">Carrinho</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {value.length} {value.length === 1 ? "produto" : "produtos"}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-amber-800 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Selecionar Produto</DialogTitle>
              <DialogDescription>
                Escolha um produto para adicionar ao pedido
              </DialogDescription>
            </DialogHeader>

            {/* BUSCA */}
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
                onValueChange={(v) => setCategoriaFiltro(v as any)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="CAFE">Cafés</SelectItem>
                  <SelectItem value="ACESSORIO">Acessórios</SelectItem>
                  <SelectItem value="COMBO">Combos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* LISTA */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <p className="text-center py-8 text-stone-500">Carregando...</p>
              ) : (
                produtosFiltrados.map((produto) => {
                  const estoqueCalculado = obterEstoqueProduto(produto);
                  const semEstoque = estoqueCalculado === 0;

                  return (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => !semEstoque && adicionarProduto(produto)}
                      disabled={semEstoque}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${semEstoque
                        ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                        : 'hover:bg-amber-50 cursor-pointer'
                        }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className={`font-medium ${semEstoque ? 'text-gray-500' : ''}`}>
                            {produto.nome}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge className="mt-1">{produto.tipoProduto}</Badge>
                            {semEstoque && (
                              <Badge variant="destructive" className="mt-1">
                                SEM ESTOQUE
                              </Badge>
                            )}
                            {estoqueCalculado != null && estoqueCalculado > 0 && (
                              <span className="text-xs text-stone-500 mt-1.5">
                                Est: {estoqueCalculado}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`font-semibold ${semEstoque ? 'text-gray-500' : ''}`}>
                          R$ {produto.precoVenda.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ALERTA DE ESTOQUE */}
      {estoqueErro && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{estoqueErro.mensagem}</AlertDescription>
        </Alert>
      )}

      {/* ITENS */}
      {itensCompletos.map((item) => {
        const estoqueDisponivel = item.estoque !== Infinity;
        const estoqueRestante = estoqueDisponivel ? item.estoque - item.quantidade : null;

        return (
          <div
            key={item.produtoId}
            className="flex items-center justify-between gap-4 border border-stone-200 rounded-lg p-3 bg-white"
          >
            {/* INFO DO PRODUTO */}
            <div className="flex-1">
              <p className="font-medium text-stone-900">{item.nome}</p>

              <div className="flex items-center gap-2 mt-1 text-sm text-stone-600">
                <span>R$ {Number(item.precoUnit).toFixed(2)}</span>
                <span>×</span>
                <span>{item.quantidade}</span>
                <span className="font-medium text-stone-900">
                  = R$ {(item.precoUnit * item.quantidade).toFixed(2)}
                </span>

                {estoqueDisponivel && (
                  <span className="text-xs text-amber-700 ml-2">
                    (Estoque: {item.estoque})
                  </span>
                )}
              </div>
            </div>

            {/* CONTROLES */}
            <div className="flex items-center gap-3">
              {/* QUANTIDADE */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-stone-600">Qtd</label>

                <div className="flex items-center border border-stone-300 rounded-md">
                  <button
                    type="button"
                    onClick={() =>
                      alterarQtd(item.produtoId, item.quantidade - 1)
                    }
                    disabled={item.quantidade <= 1}
                    className="px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={item.estoque !== Infinity ? item.estoque : undefined}
                    value={item.quantidade}
                    onChange={(e) =>
                      alterarQtd(item.produtoId, Number(e.target.value))
                    }
                    className="w-12 text-center text-sm border-x h-8"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      alterarQtd(item.produtoId, item.quantidade + 1)
                    }
                    disabled={estoqueDisponivel && item.quantidade >= item.estoque}
                    className="px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* PREÇO */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-stone-600">Preço</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.precoUnit}
                  onChange={(e) =>
                    alterarPreco(item.produtoId, Number(e.target.value))
                  }
                  className="w-24 h-8 text-sm"
                />
              </div>

              {/* REMOVER */}
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
        );
      })}

      {/* TOTAL */}
      {itensCompletos.length > 0 && (
        <div className="text-right text-xl font-bold">
          Total: R$ {totalCarrinho.toFixed(2)}
        </div>
      )}
    </div>
  );
}