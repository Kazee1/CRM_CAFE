export type TipoProduto = 'CAFE' | 'ACESSORIO' | 'COMBO';
export type StatusProduto = 'ATIVO' | 'INATIVO';

export interface ComboItemDto {
  produtoId: number;
  quantidade: number;
}

export interface Produto {
  id: number;
  nome: string;
  tipoProduto: TipoProduto;
  status: StatusProduto;
  precoVenda: number;
  custoUnitario?: number | null;
  estoque?: number | null;

  cafe?: {
    tipoCafe: string;
    pontuacaoSCA?: number;
    pesoGramas: number;
    numeroLote: string;
    dataTorra?: string;
    dataValidade?: string;
    fornecedor: string;
  };

  acessorio?: {
    descricao: string;
  };

  comboComoCombo?: {
    id: number;
    quantidade: number;
    produto: Produto;
  }[];
}
