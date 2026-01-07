"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CarrinhoBuilder } from "./carrinhoBuilder";
import { Controller, useForm } from "react-hook-form";
import { ShoppingCart, User, DollarSign, Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getPedidoById,
  createPedido,
  updatePedido,
  type CreatePedidoDto
} from "@/lib/pedidos-request";
import { getClientes, type Cliente } from "@/lib/cliente-request";

type CarrinhoItem = {
  produtoId: number;
  quantidade: number;
  precoUnit: number;
};

type PedidoFormData = {
  id?: number;
  clienteId: number;
  itens: CarrinhoItem[];
  temFrete: boolean;
  valorFrete: number;
};

type Props = {
  pedidoSelecionado?: number | null;
  onClose: () => void;
};

export function PedidoForm({ pedidoSelecionado, onClose }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingPedido, setLoadingPedido] = useState(false);

  const isEdit = pedidoSelecionado !== null && pedidoSelecionado !== undefined;

  const form = useForm<PedidoFormData>({
    defaultValues: {
      clienteId: 0,
      itens: [],
      temFrete: false,
      valorFrete: 0
    },
  });

  const itens = form.watch("itens");
  const temFrete = form.watch("temFrete");
  const valorFrete = form.watch("valorFrete");

  // Carregar clientes da API
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setLoadingClientes(true);
        const data = await getClientes();
        setClientes(data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        alert("Erro ao carregar clientes. Verifique sua conexão.");
      } finally {
        setLoadingClientes(false);
      }
    };

    carregarClientes();
  }, []);

  // Carregar dados do pedido se estiver editando
  useEffect(() => {
    const carregarPedido = async () => {
      if (!pedidoSelecionado) return;

      try {
        setLoadingPedido(true);
        const pedido = await getPedidoById(pedidoSelecionado);

        // Transformar dados da API para o formato do formulário
        const formData: PedidoFormData = {
          id: pedido.id,
          clienteId: pedido.clienteId,
          itens: pedido.itens?.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnit: item.precoUnit || 0
          })) || [],
          temFrete: false,
          valorFrete: 0
        };

        form.reset(formData);
      } catch (error) {
        console.error("Erro ao carregar pedido:", error);
        alert("Erro ao carregar pedido. Tente novamente.");
      } finally {
        setLoadingPedido(false);
      }
    };

    carregarPedido();
  }, [pedidoSelecionado, form]);

  // Calcular total do pedido
  const totalPedido = itens?.reduce((acc, item) => {
    return acc + (item.precoUnit * item.quantidade);
  }, 0) || 0;

  const totalComFrete = totalPedido + (temFrete ? valorFrete : 0);

  const onSubmit = async (data: PedidoFormData) => {
    try {
      if (!data.clienteId || data.clienteId === 0) {
        alert("Selecione um cliente");
        return;
      }

      if (!data.itens || data.itens.length === 0) {
        alert("Adicione pelo menos um produto ao pedido");
        return;
      }

      // Preparar dados para a API (sem frete)
      const pedidoDto: CreatePedidoDto = {
        clienteId: data.clienteId,
        itens: data.itens.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade
        }))
      };

      if (isEdit && data.id) {
        await updatePedido(data.id, pedidoDto);
        alert("Pedido atualizado com sucesso!");
      } else {
        await createPedido(pedidoDto);
        alert("Pedido criado com sucesso!");
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido. Verifique os dados e tente novamente.");
    }
  };

  if (loadingPedido && isEdit) {
    return (
      <div className="flex justify-center items-center py-10">
        <p>Carregando dados do pedido...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* CLIENTE */}
      <div className="space-y-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Cliente
        </h3>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-stone-700">Selecione o Cliente *</Label>
          <Controller
            control={form.control}
            name="clienteId"
            render={({ field }) => (
              <Select
                value={field.value?.toString()}
                onValueChange={(v) => field.onChange(Number(v))}
                disabled={loadingClientes}
              >
                <SelectTrigger className="h-11 bg-white">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {loadingClientes ? (
                    <SelectItem value="0" disabled>Carregando...</SelectItem>
                  ) : (
                    clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nome} ({cliente.tipo === "FISICA" ? "CPF" : "CNPJ"}: {cliente.cpfCnpj})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* ITENS DO PEDIDO */}
      <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 text-sm flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Itens do Pedido
        </h3>

        <Controller
          control={form.control}
          name="itens"
          render={({ field }) => (
            <CarrinhoBuilder
              value={field.value || []}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* FRETE */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-900" />
          <h3 className="font-semibold text-blue-900 text-sm">Frete</h3>
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            control={form.control}
            name="temFrete"
            render={({ field }) => (
              <Checkbox
                id="temFrete"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="
    border-2 border-zinc-400
    data-[state=checked]:border-primary
    data-[state=checked]:bg-primary
  "
              />
            )}
          />
          <Label
            htmlFor="temFrete"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Este pedido tem frete
          </Label>
        </div>

        {temFrete && (
          <div className="space-y-2 mt-3">
            <Label className="text-sm font-medium text-blue-700">Valor do Frete</Label>
            <Controller
              control={form.control}
              name="valorFrete"
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="h-11 bg-white"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
        )}
      </div>

      {/* RESUMO TOTAL */}
      {itens && itens.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Subtotal (produtos):</span>
            <span className="font-semibold text-green-900">
              R$ {totalPedido.toFixed(2)}
            </span>
          </div>

          {temFrete && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Frete:</span>
              <span className="font-semibold text-green-900">
                R$ {valorFrete.toFixed(2)}
              </span>
            </div>
          )}

          <div className="border-t border-green-300 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-900" />
                <span className="font-semibold text-green-900">Total do Pedido:</span>
              </div>
              <span className="text-3xl font-bold text-green-900">
                R$ {totalComFrete.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-xs text-green-700">
            {itens.length} {itens.length === 1 ? "item" : "itens"} no carrinho
            {temFrete && " • Frete incluído"}
          </p>
        </div>
      )}

      {/* AÇÕES */}
      <div className="flex gap-3 pt-4 pb-6 border-t border-stone-200">
        <Button variant="outline" className="flex-1 h-11" onClick={onClose} disabled={loadingPedido}>
          Cancelar
        </Button>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loadingPedido || loadingClientes}
          className="flex-1 h-11 bg-amber-800 hover:bg-amber-900 text-white font-semibold"
        >
          {isEdit ? "Salvar Alterações" : "Criar Pedido"}
        </Button>
      </div>
    </div>
  );
}