import { Module } from '@nestjs/common';
import { PedidoService } from './pedidos.service';
import { PedidoController } from './pedidos.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PedidoController],
  providers: [PedidoService, PrismaService],
})
export class PedidosModule {}
