import { IsInt, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CreatePedidoItemDto {
  @IsInt()
  produtoId: number;

  @IsInt()
  quantidade: number;
}

export class CreatePedidoDto {
  @IsInt()
  clienteId: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @ValidateNested({ each: true })
  @Type(() => CreatePedidoItemDto)
  itens: CreatePedidoItemDto[];
}
