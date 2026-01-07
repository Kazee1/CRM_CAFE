import { z } from "zod";

export const comboItemSchema = z.object({
  produtoId: z.number(),
  quantidade: z.number().min(1),
});

// Schema base para criação (sem ID)
const baseSchemas = {
  cafe: z.object({
    tipoProduto: z.literal("CAFE"),
    nome: z.string().min(1, "Nome é obrigatório"),
    estoque: z.number().min(0, "Estoque não pode ser negativo"),
    custoUnitario: z.number().min(0, "Custo não pode ser negativo"),
    precoVenda: z.number().min(0, "Preço não pode ser negativo"),
    
    tipoCafe: z.enum(["GRAO", "MOIDO", "CAPSULA"], {
      required_error: "Tipo do café é obrigatório"
    }),
    pontuacaoSCA: z.number().min(0).max(100).optional(),
    pesoGramas: z.number().min(1, "Peso é obrigatório"),
    numeroLote: z.string().min(1, "Número do lote é obrigatório"),
    dataTorra: z.string().min(1, "Data de torra é obrigatória"),
    dataValidade: z.string().min(1, "Data de validade é obrigatória"),
    fornecedor: z.string().min(1, "Fornecedor é obrigatório"),
  }),
  
  acessorio: z.object({
    tipoProduto: z.literal("ACESSORIO"),
    nome: z.string().min(1, "Nome é obrigatório"),
    estoque: z.number().min(0, "Estoque não pode ser negativo"),
    custoUnitario: z.number().min(0, "Custo não pode ser negativo"),
    precoVenda: z.number().min(0, "Preço não pode ser negativo"),
    descricao: z.string().optional(),
  }),
  
  combo: z.object({
    tipoProduto: z.literal("COMBO"),
    nome: z.string().min(1, "Nome é obrigatório"),
    precoVenda: z.number().min(0, "Preço não pode ser negativo"),
    comboItens: z.array(comboItemSchema).min(1, "Adicione pelo menos 1 item ao combo"),
  }),
};

// Schema para criação (sem ID)
export const produtoCreateSchema = z.discriminatedUnion("tipoProduto", [
  baseSchemas.cafe,
  baseSchemas.acessorio,
  baseSchemas.combo,
]);

// Schema para edição (com ID)
export const produtoEditSchema = z.discriminatedUnion("tipoProduto", [
  baseSchemas.cafe.extend({ id: z.number() }),
  baseSchemas.acessorio.extend({ id: z.number() }),
  baseSchemas.combo.extend({ id: z.number() }),
]);

export type ProdutoCreateData = z.infer<typeof produtoCreateSchema>;
export type ProdutoEditData = z.infer<typeof produtoEditSchema>;
export type ProdutoFormData = ProdutoCreateData | ProdutoEditData;