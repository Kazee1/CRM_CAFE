import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { PedidoService } from "./pedidos.service";
import { CreatePedidoDto } from "./dto/create-pedido.dto";
import { UpdatePedidoDto } from "./dto/update-pedido.dto";
import { UpdateStatusPedidoDto } from "./dto/update-status-pedido.dto";

@Controller("pedidos")
export class PedidoController {
  constructor(private readonly service: PedidoService) { }

  @Post()
  create(@Body() dto: CreatePedidoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePedidoDto,
  ) {
    return this.service.update(Number(id), dto);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusPedidoDto,
  ) {
    return this.service.updateStatus(Number(id), dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Get("cliente/:id")
  findByCliente(@Param("id") id: string) {
    return this.service.findByCliente(Number(id));
  }


}

