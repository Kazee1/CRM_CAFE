import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { ClienteService } from "./cliente.service";
import { Prisma } from "@prisma/client";

import { CreateClienteDto } from "./dto/create-cliente.dto";
import { UpdateClienteDto } from "./dto/update-cliente.dto";


@Controller("clientes")
export class ClienteController {
  constructor(private readonly clientesService: ClienteService) { }

  /* =====================
     LISTAR CLIENTES
  ===================== */
  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  /* =====================
     BUSCAR POR ID
  ===================== */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  /* =====================
     CRIAR CLIENTE
  ===================== */
  @Post()
  create(@Body() data: CreateClienteDto) {
    return this.clientesService.create(data);
  }

  /* =====================
     ATUALIZAR CLIENTE
  ===================== */
  @Put(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, data);
  }

  /* =====================
     DELETAR CLIENTE
  ===================== */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }

  /* =====================
     TOGGLE STATUS
  ===================== */
  @Patch(":id/toggle-status")
  toggleStatus(@Param("id", ParseIntPipe) id: number) {
    return this.clientesService.toggleStatus(id);
  }
}
