import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /* =====================
     LISTAR FUNCIONÁRIOS
  ===================== */
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  /* =====================
     BUSCAR POR ID
  ===================== */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  /* =====================
     CRIAR FUNCIONÁRIO
  ===================== */
  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  /* =====================
     ATUALIZAR FUNCIONÁRIO
  ===================== */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ) {
    return this.userService.update(id, data);
  }

  /* =====================
     DELETAR FUNCIONÁRIO
  ===================== */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id);
  }
}
