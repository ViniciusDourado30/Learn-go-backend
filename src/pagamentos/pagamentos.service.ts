import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PagamentosService {
  private stripe: Stripe;

  constructor() {
    // Inicializa o Stripe usando a sua chave secreta do .env
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  async criarPaymentIntent(amount: number, metadata: any) {
    // O Stripe processa valores em centavos. R$ 50,00 = 5000 centavos.
    const valorEmCentavos = Math.round(amount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: valorEmCentavos,
      currency: 'brl', // Moeda Real Brasileiro
      payment_method_types: ['card'], // Habilita Cartão de Crédito
      metadata: metadata, // Guarda infos de qual curso/aula está sendo pago
    });

    // Retorna o "segredo" que o frontend precisa para abrir o formulário do cartão
    return { clientSecret: paymentIntent.client_secret };
  }
}