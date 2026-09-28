import { Controller, Post, Body } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';

@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { amount: number; metadata?: any }) {
    return this.pagamentosService.criarPaymentIntent(body.amount, body.metadata || {});
  }
}