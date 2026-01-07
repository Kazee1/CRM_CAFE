import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  ValidateIf,
  Min,
} from 'class-validator';
import { TipoProduto, TipoCafe } from '@prisma/client';
import { ComboItemDto } from './combo-item.dto';

export class CreateProdutoDto {
  @IsEnum(TipoProduto)
  tipoProduto: TipoProduto;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsNumber()
  @Min(0)
  precoVenda: number;

  @ValidateIf((o) => o.tipoProduto !== 'COMBO')
  @IsInt()
  @Min(0)
  estoque?: number;

  @ValidateIf((o) => o.tipoProduto !== 'COMBO')
  @IsNumber()
  @Min(0)
  custoUnitario?: number;

  /* ===== CAFÉ ===== */
  @ValidateIf((o) => o.tipoProduto === 'CAFE')
  @IsEnum(TipoCafe)
  tipoCafe?: TipoCafe;

  @ValidateIf((o) => o.tipoProduto === 'CAFE')
  @IsOptional()
  pontuacaoSCA?: number;

  @ValidateIf((o) => o.tipoProduto === 'CAFE')
  @IsInt()
  pesoGramas?: number;

  @ValidateIf((o) => o.tipoProduto === 'CAFE')
  @IsString()
  numeroLote?: string;

  @ValidateIf((o) => o.tipoProduto === 'CAFE')
  @IsDateString()
  dataTorra?: string;

  @ValidateIf((o) => o.tipoProduto === 'CAFE')
  @IsDateString()
  dataValidade?: string;

  @ValidateIf((o) => o.tipoProduto === 'CAFE')
  @IsString()
  fornecedor?: string;

  /* ===== ACESSÓRIO ===== */
  @ValidateIf((o) => o.tipoProduto === 'ACESSORIO')
  @IsOptional()
  @IsString()
  descricao?: string;

  /* ===== COMBO ===== */
  @ValidateIf((o) => o.tipoProduto === 'COMBO')
  comboItens?: ComboItemDto[];
}
