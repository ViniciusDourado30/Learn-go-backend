import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StripeService } from './stripe.service';
import { ZoomService } from './zoom.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AgendamentosService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private zoomService: ZoomService
  ) {}

  async atualizarAulasExpiradas() {
    try {
      const agora = new Date();
      const aulas = await this.prisma.aulaAgendada.findMany({
        where: {
          status: { in: ['AGENDADA', 'PENDENTE_PAGAMENTO', 'PAGA'] }
        }
      });

      const idsParaConcluir: string[] = [];

      for (const aula of aulas) {
        try {
          const [ano, mes, dia] = aula.data_aula.split('-').map(Number);
          const horaStr = aula.hora_fim || aula.hora_inicio;
          const [h, m] = horaStr.split(':').map(Number);
          const dataHoraFim = new Date(ano, mes - 1, dia, aula.hora_fim ? h : h + 1, m);

          if (dataHoraFim < agora) {
            idsParaConcluir.push(aula.id);
          }
        } catch {
          // formato não suportado, pula
        }
      }

      if (idsParaConcluir.length > 0) {
        await this.prisma.aulaAgendada.updateMany({
          where: { id: { in: idsParaConcluir } },
          data: { status: 'CONCLUIDA' }
        });
      }
    } catch (e) {
      console.error('Erro ao atualizar aulas expiradas:', e);
    }
  }

  async agendarAula(alunoId: string, dto: CreateAgendamentoDto) {
    const professor = await this.prisma.professorProfile.findUnique({
      where: { id: dto.professorId },
    });

    if (!professor) {
      throw new NotFoundException('Professor não encontrado.');
    }

    const aulaExistente = await this.prisma.aulaAgendada.findFirst({
      where: {
        professorId: dto.professorId,
        data_aula: dto.data_aula,
        hora_inicio: dto.hora_inicio,
        status: {
          in: ['AGENDADA', 'PENDENTE_PAGAMENTO', 'PAGA'] 
        }
      }
    });

    if (aulaExistente) {
      throw new ConflictException('Este horário acabou de ser reservado por outro aluno. Escolha outro horário.');
    }

    const hashReuniao = uuidv4().replace(/-/g, '');
    const linkReuniao = `https://meet.jit.si/LearnAndGo_${hashReuniao}`;

    const aula = await this.prisma.aulaAgendada.create({
      data: {
        alunoId: alunoId,
        professorId: dto.professorId,
        data_aula: dto.data_aula,
        hora_inicio: dto.hora_inicio,
        hora_fim: dto.hora_fim,
        preco_cobrado: dto.preco_cobrado,
        assunto: dto.assunto,
        link_reuniao: linkReuniao,
        status: 'AGENDADA'
      },
    });

    await this.prisma.notificacao.create({
      data: {
        userId: professor.userId,
        tipo: 'class',
        titulo: 'Nova aula agendada',
        descricao: `Uma aula foi agendada para ${dto.data_aula} às ${dto.hora_inicio}.`
      }
    });

    return { message: 'Aula agendada com sucesso!', aula };
  }

  async listarAulasDoAluno(alunoId: string) {
    await this.atualizarAulasExpiradas();
    return this.prisma.aulaAgendada.findMany({
      where: { alunoId: alunoId },
      include: { professor: { select: { id: true, nome: true, sobrenome: true, foto_url: true } } },
      orderBy: { data_aula: 'asc' }
    });
  }

  async listarAulasDoProfessor(userId: string) {
    const professor = await this.prisma.professorProfile.findUnique({ where: { userId } });
    
    if (!professor) throw new NotFoundException('Perfil não encontrado.');

    await this.atualizarAulasExpiradas();
    return this.prisma.aulaAgendada.findMany({
      where: { professorId: professor.id },
      include: { aluno: { select: { id: true, nome: true, sobrenome: true, email: true } } },
      orderBy: { data_aula: 'asc' }
    });
  }

  async buscarHorariosOcupados(professorId: string, dataAula: string) {
    const aulas = await this.prisma.aulaAgendada.findMany({
      where: {
        professorId: professorId,
        data_aula: dataAula,
        status: { in: ['AGENDADA', 'PENDENTE_PAGAMENTO', 'PAGA'] }
      },
      select: { hora_inicio: true }
    });

    return aulas.map(aula => aula.hora_inicio);
  }

  async fecharAulasDoDia(dataAula: string) {
    const aulas = await this.prisma.aulaAgendada.findMany({
      where: { data_aula: dataAula, status: 'AGENDADA' }
    });

    for (const aula of aulas) {
      if (!aula.id_reuniao_zoom) continue;

      const aulaAconteceu = await this.zoomService.verificarSeAulaAconteceu(aula.id_reuniao_zoom);

      if (aulaAconteceu) {
        await this.prisma.aulaAgendada.update({
          where: { id: aula.id },
          data: { status: 'CONCLUIDA' }
        });
      } else {
        if (aula.stripe_payment_id) {
          await this.stripeService.reembolsarPagamento(aula.stripe_payment_id);
        }
        
        await this.prisma.aulaAgendada.update({
          where: { id: aula.id },
          data: { status: 'CANCELADA_REEMBOLSADA' }
        });
      }
    }
  }
}