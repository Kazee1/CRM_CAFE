import { IsEnum } from "class-validator";
import { StatusPedido } from "@prisma/client";

export class UpdateStatusPedidoDto {
  @IsEnum(StatusPedido)
  status: StatusPedido;
}
