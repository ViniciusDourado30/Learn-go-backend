import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_temporaria', {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  async criarPaymentIntent(valor: number, aulaId: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(valor * 100), 
      currency: 'brl',
      metadata: {
        aulaId: aulaId, 
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  }

  async reembolsarPagamento(paymentIntentId: string): Promise<any> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    return refund;
  }
}