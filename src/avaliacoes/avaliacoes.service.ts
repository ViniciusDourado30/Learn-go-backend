import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';

@Injectable()
export class AvaliacoesService {
  constructor(private prisma: PrismaService) {}

  async criarAvaliacao(alunoId: string, dto: CreateAvaliacaoDto) {
    const professor = await this.prisma.professorProfile.findUnique({ where: { id: dto.professorId } });
    if (!professor) throw new NotFoundException('Professor não encontrado.');

    const existe = await this.prisma.avaliacao.findUnique({
      where: { alunoId_professorId: { alunoId, professorId: dto.professorId } }
    });
    if (existe) throw new BadRequestException('Você já avaliou este professor.');

    const avaliacao = await this.prisma.avaliacao.create({
      data: { alunoId, professorId: dto.professorId, nota: dto.nota, comentario: dto.comentario }
    });

    // Recalcula a média de avaliação do professor
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

    // Cria notificação para o professor
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
