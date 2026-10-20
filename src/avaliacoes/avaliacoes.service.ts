import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';

@Injectable()
export class AvaliacoesService {
  constructor(private prisma: PrismaService) {}

  async podeAvaliar(alunoId: string, professorId: string): Promise<{ pode: boolean; motivo?: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: alunoId } });
    if (!user || user.role !== 'ALUNO') {
      return { pode: false, motivo: 'Apenas alunos podem avaliar professores.' };
    }

    const professor = await this.prisma.professorProfile.findUnique({ where: { id: professorId } });
    if (!professor) throw new NotFoundException('Professor não encontrado.');

    if (professor.userId === alunoId) {
      return { pode: false, motivo: 'Você não pode avaliar seu próprio perfil.' };
    }

    const jaAvaliou = await this.prisma.avaliacao.findUnique({
      where: { alunoId_professorId: { alunoId, professorId } }
    });
    if (jaAvaliou) {
      return { pode: false, motivo: 'Você já avaliou este professor.' };
    }

    const comprouCurso = await this.prisma.matriculaCurso.findFirst({
      where: {
        alunoId,
        curso: { professorId }
      }
    });

    const teveAula = await this.prisma.aulaAgendada.findFirst({
      where: {
        alunoId,
        professorId,
        status: { in: ['AGENDADA', 'PAGA', 'REALIZADA', 'CONCLUIDA'] }
      }
    });

    if (!comprouCurso && !teveAula) {
      return {
        pode: false,
        motivo: 'Você só pode avaliar professores dos quais comprou um curso ou teve aulas agendadas.'
      };
    }

    return { pode: true };
  }

  async criarAvaliacao(alunoId: string, dto: CreateAvaliacaoDto) {
    const checagem = await this.podeAvaliar(alunoId, dto.professorId);
    if (!checagem.pode) {
      throw new BadRequestException(checagem.motivo);
    }

    const professor = await this.prisma.professorProfile.findUnique({ where: { id: dto.professorId } });
    if (!professor) throw new NotFoundException('Professor não encontrado.');

    const avaliacao = await this.prisma.avaliacao.create({
      data: { alunoId, professorId: dto.professorId, nota: dto.nota, comentario: dto.comentario }
    });

    const aggregation = await this.prisma.avaliacao.aggregate({
      where: { professorId: dto.professorId },
      _avg: { nota: true },
      _count: { nota: true }
    });

    await this.prisma.professorProfile.update({
      where: { id: dto.professorId },
      data: {
        rating: Math.round((aggregation._avg.nota || 5) * 10) / 10,
        total_reviews: aggregation._count.nota
      }
    });

    await this.prisma.notificacao.create({
      data: {
        userId: professor.userId,
        tipo: 'review',
        titulo: 'Nova avaliação',
        descricao: `Um aluno deixou ${dto.nota} estrela${dto.nota > 1 ? 's' : ''} na sua avaliação.${dto.comentario ? ' "' + dto.comentario.substring(0, 80) + '"' : ''}`
      }
    });

    return { message: 'Avaliação enviada com sucesso!', avaliacao };
  }

  async listarAvaliacoesProfessor(professorId: string) {
    return this.prisma.avaliacao.findMany({
      where: { professorId },
      include: { aluno: { select: { id: true, nome: true, sobrenome: true } } },
      orderBy: { criado_em: 'desc' }
    });
  }
}
