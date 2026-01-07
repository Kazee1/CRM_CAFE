import { IsInt, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class UpdatePedidoItemDto {
  @IsInt()
  produtoId: number;

  @IsInt()
  quantidade: number;
}

export class UpdatePedidoDto {
  @IsInt()
  clienteId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePedidoItemDto)
  itens: UpdatePedidoItemDto[];
}
