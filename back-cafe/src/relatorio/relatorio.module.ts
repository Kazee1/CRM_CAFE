import { Module } from '@nestjs/common';
import { RelatorioService } from './relatorio.service';
import { RelatorioController } from './relatorio.controller';

@Module({
  controllers: [RelatorioController],
  providers: [RelatorioService],
})
export class RelatorioModule {}
