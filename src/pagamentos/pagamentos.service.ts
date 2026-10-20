import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PagamentosService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  async criarPaymentIntent(amount: number, metadata: any) {
    const valorEmCentavos = Math.round(amount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: valorEmCentavos,
      currency: 'brl',
      payment_method_types: ['card'],
      metadata: metadata,
    });
    
    return { clientSecret: paymentIntent.client_secret };
  }
}