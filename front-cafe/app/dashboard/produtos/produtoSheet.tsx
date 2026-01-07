"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboBuilder } from "./combobuilder";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee, Package, Gift, Calendar, DollarSign, Box, Percent } from "lucide-react";
import { createProduto, updateProduto } from "@/lib/produto-request";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { produtoCreateSchema, produtoEditSchema, ProdutoFormData } from "./schemas/produto.schema";

type Props = {
  produtoSelecionado?: ProdutoFormData | null;
  onClose: () => void;
};

export function ProdutoForm({ produtoSelecionado, onClose }: Props) {
  const isEdit = produtoSelecionado && "id" in produtoSelecionado;
  
  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(isEdit ? produtoEditSchema : produtoCreateSchema),
    defaultValues: produtoSelecionado ?? { tipoProduto: "CAFE" },
  });

  const tipoProduto = form.watch("tipoProduto");
  const custoUnitario = form.watch("custoUnitario");
  const margemMarkup = form.watch("margemMarkup");
  const comboItens = form.watch("comboItens");

  useEffect(() => {
    if (produtoSelecionado) {
      form.reset(produtoSelecionado);
    } else {
      form.reset({ tipoProduto: "CAFE" });
    }
  }, [produtoSelecionado, form]);

  // Calcular preço de venda baseado no custo e margem
  useEffect(() => {
    if (tipoProduto !== "COMBO" && custoUnitario && margemMarkup !== undefined && margemMarkup !== null) {
      const precoCalculado = custoUnitario * (1 + margemMarkup / 100);
      form.setValue("precoVenda", Number(precoCalculado.toFixed(2)));
    }
  }, [custoUnitario, margemMarkup, tipoProduto, form]);

  // Calcular preço de venda do combo baseado nos itens e margem
  useEffect(() => {
    if (tipoProduto === "COMBO" && comboItens && comboItens.length > 0 && margemMarkup !== undefined && margemMarkup !== null) {
      // Buscar produtos para calcular custo
      const calcularPrecoCombo = async () => {
        try {
          const { getProdutos } = await import("@/lib/produto-request");
          const produtos = await getProdutos();
          
          let custoTotal = 0;
          comboItens.forEach((item: any) => {
            const produto = produtos.find((p: any) => p.id === item.produtoId);
            if (produto && produto.custoUnitario) {
              custoTotal += Number(produto.custoUnitario) * item.quantidade;
            }
          });
          
          if (custoTotal > 0) {
            const precoCalculado = custoTotal * (1 + margemMarkup / 100);
            form.setValue("precoVenda", Number(precoCalculado.toFixed(2)));
          }
        } catch (error) {
          console.error("Erro ao calcular preço do combo:", error);
        }
      };
      
      calcularPrecoCombo();
    }
  }, [comboItens, margemMarkup, tipoProduto, form]);

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      if (isEdit) {
        await updateProduto((data as any).id, data);
      } else {
        await createProduto(data);
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Verifique os dados e tente novamente.");
    }
  };

  const precoVenda = form.watch("precoVenda");

  return (
    <div className="space-y-6 mt-6">
      {/* TIPO DE PRODUTO */}
      <div className="space-y-2 ml-4">
        <Label className="text-sm font-medium text-stone-700">Tipo de Produto *</Label>
        <Select
          value={tipoProduto}
          onValueChange={(v) => form.setValue("tipoProduto", v as any)}
          disabled={isEdit}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CAFE">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Café
              </div>
            </SelectItem>
            <SelectItem value="ACESSORIO">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Acessório
              </div>
            </SelectItem>
            <SelectItem value="COMBO">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Combo
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {isEdit && (
          <p className="text-xs text-stone-500">O tipo não pode ser alterado após a criação</p>
        )}
      </div>

      {/* INFORMAÇÕES BÁSICAS */}
      <div className="space-y-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
          <Box className="h-4 w-4" />
          Informações Básicas
        </h3>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-stone-700">Nome *</Label>
          <Input
            placeholder="Ex: Café Etiópia Premium"
            {...form.register("nome")}
            className="h-11"
          />
          {form.formState.errors.nome && (
            <p className="text-xs text-red-600">{form.formState.errors.nome.message}</p>
          )}
        </div>

        {tipoProduto !== "COMBO" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">Estoque *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  {...form.register("estoque", { valueAsNumber: true })}
                  className="h-11"
                />
                {form.formState.errors.estoque && (
                  <p className="text-xs text-red-600">{(form.formState.errors.estoque as any).message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">Custo (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("custoUnitario", { valueAsNumber: true })}
                  className="h-11"
                />
                {form.formState.errors.custoUnitario && (
                  <p className="text-xs text-red-600">{(form.formState.errors.custoUnitario as any).message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">Margem de Markup (%) *</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    {...form.register("margemMarkup", { valueAsNumber: true })}
                    className="h-11 pl-10"
                  />
                </div>
                {form.formState.errors.margemMarkup && (
                  <p className="text-xs text-red-600">{(form.formState.errors.margemMarkup as any).message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">
                  Preço de Venda (R$) *
                  <span className="text-xs text-stone-500 ml-2">(calculado)</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("precoVenda", { valueAsNumber: true })}
                    className="h-11 pl-10 font-semibold bg-stone-100"
                    readOnly
                  />
                </div>
                {form.formState.errors.precoVenda && (
                  <p className="text-xs text-red-600">{form.formState.errors.precoVenda.message}</p>
                )}
              </div>
            </div>

            {custoUnitario && precoVenda && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-900">
                  <strong>Lucro unitário:</strong> R$ {(precoVenda - custoUnitario).toFixed(2)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CAMPOS ESPECÍFICOS - CAFÉ */}
      {tipoProduto === "CAFE" && (
        <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 text-sm flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Especificações do Café
          </h3>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">Tipo do Café *</Label>
            <Controller
              control={form.control}
              name="tipoCafe"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRAO">Grão</SelectItem>
                    <SelectItem value="MOIDO">Moído</SelectItem>
                    <SelectItem value="CAPSULA">Cápsula</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.tipoCafe && (
              <p className="text-xs text-red-600">{(form.formState.errors.tipoCafe as any).message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700">Pontuação SCA</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0 - 100"
                {...form.register("pontuacaoSCA", { valueAsNumber: true })}
                className="h-11 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700">Peso (g) *</Label>
              <Input
                type="number"
                placeholder="250"
                {...form.register("pesoGramas", { valueAsNumber: true })}
                className="h-11 bg-white"
              />
              {form.formState.errors.pesoGramas && (
                <p className="text-xs text-red-600">{(form.formState.errors.pesoGramas as any).message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">Número do Lote *</Label>
            <Input
              placeholder="Ex: LOT2024-001"
              {...form.register("numeroLote")}
              className="h-11 bg-white"
            />
            {form.formState.errors.numeroLote && (
              <p className="text-xs text-red-600">{(form.formState.errors.numeroLote as any).message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data Torra *
              </Label>
              <Input
                type="date"
                {...form.register("dataTorra")}
                className="h-11 bg-white"
              />
              {form.formState.errors.dataTorra && (
                <p className="text-xs text-red-600">{(form.formState.errors.dataTorra as any).message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Validade *
              </Label>
              <Input
                type="date"
                {...form.register("dataValidade")}
                className="h-11 bg-white"
              />
              {form.formState.errors.dataValidade && (
                <p className="text-xs text-red-600">{(form.formState.errors.dataValidade as any).message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">Fornecedor *</Label>
            <Input
              placeholder="Nome do fornecedor"
              {...form.register("fornecedor")}
              className="h-11 bg-white"
            />
            {form.formState.errors.fornecedor && (
              <p className="text-xs text-red-600">{(form.formState.errors.fornecedor as any).message}</p>
            )}
          </div>
        </div>
      )}

      {/* CAMPOS ESPECÍFICOS - ACESSÓRIO */}
      {tipoProduto === "ACESSORIO" && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Detalhes do Acessório
          </h3>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-700">Descrição</Label>
            <Input
              placeholder="Descreva o acessório"
              {...form.register("descricao")}
              className="h-11 bg-white"
            />
          </div>
        </div>
      )}

      {/* CAMPOS ESPECÍFICOS - COMBO */}
      {tipoProduto === "COMBO" && (
        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 text-sm flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Composição do Combo
          </h3>

          <Controller
            control={form.control}
            name="comboItens"
            render={({ field }) => (
              <ComboBuilder value={field.value || []} onChange={field.onChange} />
            )}
          />
          {form.formState.errors.comboItens && (
            <p className="text-xs text-red-600">{(form.formState.errors.comboItens as any).message}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700">
                Margem de Markup (%) *
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  {...form.register("margemMarkup", { valueAsNumber: true })}
                  className="h-11 pl-10"
                />
              </div>
              {form.formState.errors.margemMarkup && (
                <p className="text-xs text-red-600">{(form.formState.errors.margemMarkup as any).message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700">
                Preço de Venda (R$) *
                <span className="text-xs text-stone-500 ml-2">(calculado)</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-stone-500" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("precoVenda", { valueAsNumber: true })}
                  className="h-11 pl-10 font-semibold bg-stone-100"
                  readOnly
                />
              </div>
              {form.formState.errors.precoVenda && (
                <p className="text-xs text-red-600">{form.formState.errors.precoVenda.message}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-stone-600">
            O preço será calculado automaticamente baseado no custo dos itens + margem
          </p>
        </div>
      )}

      {/* AÇÕES */}
      <div className="flex gap-3 pt-4 pb-6 ml-4 border-t border-stone-200">
        <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
          Cancelar
        </Button>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          className="flex-1 h-11 bg-amber-800 hover:bg-amber-900 text-white font-semibold"
        >
          {isEdit ? "Salvar Alterações" : "Criar Produto"}
        </Button>
      </div>
    </div>
  );
}