import { Module } from '@nestjs/common';
import { AulasController } from './aulas.controller';
import { AulasService } from './aulas.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AulasController],
  providers: [AulasService, PrismaService],
})
export class AulasModule {}