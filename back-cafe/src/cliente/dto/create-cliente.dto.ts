import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { TipoCliente } from "@prisma/client";

export class CreateClienteDto {
  @IsString()
  @MinLength(3)
  nome: string;

  @IsEnum(TipoCliente)
  tipo: TipoCliente;

  @IsString()
  @MinLength(11)
  cpfCnpj: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(10)
  telefone: string;

  @IsString()
  @MinLength(5)
  endereco: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
