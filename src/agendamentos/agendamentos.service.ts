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

  async agendarAula(alunoId: string, dto: CreateAgendamentoDto) {
    const professor = await this.prisma.professorProfile.findUnique({
      where: { id: dto.professorId },
    });

    if (!professor) {
      throw new NotFoundException('Professor não encontrado.');
    }

    // --- VERIFICAÇÃO CONTRA AGENDAMENTO DUPLO (CONCORRÊNCIA) ---
    const aulaExistente = await this.prisma.aulaAgendada.findFirst({
      where: {
        professorId: dto.professorId,
        data_aula: dto.data_aula,
        hora_inicio: dto.hora_inicio,
        status: {
          // Se estiver cancelada, o horário volta a ficar livre para agendar!
          in: ['AGENDADA', 'PENDENTE_PAGAMENTO', 'PAGA'] 
        }
      }
    });

    if (aulaExistente) {
      throw new ConflictException('Este horário acabou de ser reservado por outro aluno. Escolha outro horário.');
    }

    // GERAÇÃO DO LINK
    const hashReuniao = uuidv4().replace(/-/g, '');
    const linkReuniao = `https://meet.jit.si/LearnAndGo_${hashReuniao}`;

    // SALVA A AULA LINCANDO O ALUNO E O PROFESSOR
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

    // Notifica o professor
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

  // AGENDA DO ALUNO (Traz os dados do professor pra mostrar na tela)
  async listarAulasDoAluno(alunoId: string) {
    return this.prisma.aulaAgendada.findMany({
      where: { alunoId: alunoId },
      include: { professor: { select: { id: true, nome: true, sobrenome: true, foto_url: true } } },
      orderBy: { data_aula: 'asc' }
    });
  }

  // AGENDA DO PROFESSOR (Traz os dados do aluno pra mostrar na tela)
  async listarAulasDoProfessor(userId: string) {
    const professor = await this.prisma.professorProfile.findUnique({ where: { userId } });
    
    if (!professor) throw new NotFoundException('Perfil não encontrado.');

    return this.prisma.aulaAgendada.findMany({
      where: { professorId: professor.id },
      include: { aluno: { select: { id: true, nome: true, sobrenome: true, email: true } } },
      orderBy: { data_aula: 'asc' }
    });
  }

  // ROTA PARA O FRONTEND SABER QUAIS HORÁRIOS ESTÃO OCUPADOS
  async buscarHorariosOcupados(professorId: string, dataAula: string) {
    const aulas = await this.prisma.aulaAgendada.findMany({
      where: {
        professorId: professorId,
        data_aula: dataAula,
        status: { in: ['AGENDADA', 'PENDENTE_PAGAMENTO', 'PAGA'] }
      },
      select: { hora_inicio: true }
    });

    // Retorna apenas um array com as strings das horas ocupadas. Ex: ["09:00", "14:00"]
    return aulas.map(aula => aula.hora_inicio);
  }

  // Adicione essa função no AgendamentosService

  async fecharAulasDoDia(dataAula: string) {
    // Busca todas as aulas que estavam agendadas para hoje
    const aulas = await this.prisma.aulaAgendada.findMany({
      where: { data_aula: dataAula, status: 'AGENDADA' }
    });

    for (const aula of aulas) {
      if (!aula.id_reuniao_zoom) continue;

      // Chama a auditoria antifraude do Zoom
      const aulaAconteceu = await this.zoomService.verificarSeAulaAconteceu(aula.id_reuniao_zoom);

      if (aulaAconteceu) {
        // Aula confirmada! O professor recebe.
        await this.prisma.aulaAgendada.update({
          where: { id: aula.id },
          data: { status: 'REALIZADA' }
        });
        // Aqui você acionaria o Stripe Connect para transferir o $ pro professor
      } else {
        // Fraude ou o professor faltou. Estorna o cartão do aluno!
        if (aula.stripe_payment_id) { // <-- Adicionamos esta verificação
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