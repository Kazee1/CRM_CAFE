import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ProdutoService } from './produto.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

import { Delete } from '@nestjs/common';

@Controller('produtos')
export class ProdutoController {
  constructor(private readonly service: ProdutoService) { }

  @Post()
  create(@Body() dto: CreateProdutoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.service.update(Number(id), dto);
  }

  @Patch(':id/status')
  toggleStatus(@Param('id') id: string) {
    return this.service.toggleStatus(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}
