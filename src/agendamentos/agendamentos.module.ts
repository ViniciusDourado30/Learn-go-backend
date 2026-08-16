import { Module } from '@nestjs/common';
import { AgendamentosController } from './agendamentos.controller';
import { AgendamentosService } from './agendamentos.service';
import { PrismaService } from '../prisma.service';
import { StripeService } from './stripe.service';
import { ZoomService } from './zoom.service';

@Module({
  controllers: [AgendamentosController],
  providers: [AgendamentosService, PrismaService, StripeService, ZoomService],
})
export class AgendamentosModule {}