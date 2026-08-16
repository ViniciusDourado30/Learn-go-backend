import { Controller, Post, Get, Headers, Req, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';
import { ZoomService } from './zoom.service';
import { AgendamentosService } from './agendamentos.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(
    private agendamentosService: AgendamentosService,
    private prisma: PrismaService,
    private zoomService: ZoomService
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async agendar(@Request() req, @Body() dto: CreateAgendamentoDto) {
    return this.agendamentosService.agendarAula(req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get('meus')
  async listarMeusAgendamentos(@Request() req) {
    if (req.user.role === 'PROFESSOR') {
      return this.agendamentosService.listarAulasDoProfessor(req.user.sub);
    }
    return this.agendamentosService.listarAulasDoAluno(req.user.sub);
  }

  @Get('ocupados/:professorId/:data')
  async ocupados(@Param('professorId') profId: string, @Param('data') data: string) {
    return this.agendamentosService.buscarHorariosOcupados(profId, data);
  }

  @Post('webhook-stripe')
  async stripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' as any });
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

      const aula = await this.prisma.aulaAgendada.findUnique({
        where: { id: aulaId },
        include: { professor: true, aluno: true }
      });

      if (aula) {
        const dataHoraISO = `${aula.data_aula}T${aula.hora_inicio}:00Z`;
        
        const zoomData = await this.zoomService.criarReuniao(
          `Aula de ${aula.assunto || 'Idiomas'} - Learn&Go`,
          dataHoraISO,
          60
        );

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