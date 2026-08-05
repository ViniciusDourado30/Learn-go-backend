import { Controller, Post, Headers, Req, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';
import { ZoomService } from './zoom.service';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(
    private prisma: PrismaService,
    private zoomService: ZoomService // Adicione o Zoom aqui no construtor
  ) {}

  @Post('webhook-stripe')
  async stripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const aulaId = paymentIntent.metadata.aulaId;

      // 1. Busca a aula no banco
      const aula = await this.prisma.aulaAgendada.findUnique({
        where: { id: aulaId },
        include: { professor: true, aluno: true }
      });

      if (aula) {
        // 2. Pagamento aprovado! Agora sim gera o link oficial no Zoom
        const dataHoraISO = `${aula.data_aula}T${aula.hora_inicio}:00Z`; // Formata pra ISO
        
        const zoomData = await this.zoomService.criarReuniao(
          `Aula de ${aula.assunto || 'Idiomas'} - Learn&Go`,
          dataHoraISO,
          60 // Duração (pegue do professor.duracao_aula se preferir)
        );

        // 3. Salva no banco o link e oficializa o agendamento
        await this.prisma.aulaAgendada.update({
          where: { id: aulaId },
          data: { 
            status: 'AGENDADA',
            link_reuniao: zoomData.joinUrl,
            id_reuniao_zoom: zoomData.zoomMeetingId
          }
        });
      }
    }

    return { received: true };
  }
}