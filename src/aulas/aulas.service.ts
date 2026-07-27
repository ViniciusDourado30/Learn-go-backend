import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigurarDisponibilidadeDto } from './dto/configurar-disponibilidade.dto';

@Injectable()
export class AulasService {
  constructor(private prisma: PrismaService) {}

  async configurarDisponibilidade(userId: string, dto: ConfigurarDisponibilidadeDto) {
    const professor = await this.prisma.professorProfile.findUnique({
      where: { userId },
    });

    if (!professor) {
      throw new UnauthorizedException('Perfil de professor não encontrado.');
    }

    let totalPreco = 0;
    let totalBlocos = 0;
    const blocosParaInserir: any[] = [];

    for (const dia of dto.dias) {
      for (const bloco of dia.blocos) {
        blocosParaInserir.push({
          professorId: professor.id,
          dia_semana: dia.dia_semana,
          hora_inicio: bloco.hora_inicio,
          hora_fim: bloco.hora_fim,
          preco: bloco.preco,
        });
        totalPreco += bloco.preco;
        totalBlocos++;
      }
    }

    const mediaCalculada = totalBlocos > 0 ? (totalPreco / totalBlocos) : 0;

    await this.prisma.$transaction([
      this.prisma.disponibilidadeBloco.deleteMany({
        where: { professorId: professor.id },
      }),
      
      this.prisma.disponibilidadeBloco.createMany({
        data: blocosParaInserir,
      }),
      
      this.prisma.professorProfile.update({
        where: { id: professor.id },
        data: {
          duracao_aula: dto.duracao_aula,
          intervalo_aula: dto.intervalo_aula,
          preco_medio: mediaCalculada,
        },
      }),
    ]);

    return { 
      message: 'Disponibilidade salva com sucesso!',
      preco_medio: mediaCalculada 
    };
  }

  // --- FUNÇÃO GET QUE FALTAVA ---
  // --- FUNÇÃO GET ATUALIZADA ---
  async obterDisponibilidade(userId: string) {
    const professor = await this.prisma.professorProfile.findUnique({
      where: { userId },
      include: {
        disponibilidades: {
          orderBy: [
            { dia_semana: 'asc' },
            { hora_inicio: 'asc' }
          ]
        }
      }
    });

    if (!professor) {
      throw new UnauthorizedException('Perfil de professor não encontrado.');
    }

    // Mapeando os blocos para injetar a duração e calcular as horas do bloco
    const blocosFormatados = professor.disponibilidades.map(bloco => {
      
      // Cálculo bônus para o seu selo verde no Frontend (ex: 09:00 às 12:00 = 3h)
      const [horaInicio, minInicio] = bloco.hora_inicio.split(':').map(Number);
      const [horaFim, minFim] = bloco.hora_fim.split(':').map(Number);
      const totalMinutosInicio = (horaInicio * 60) + minInicio;
      const totalMinutosFim = (horaFim * 60) + minFim;
      
      let diffMinutos = totalMinutosFim - totalMinutosInicio;
      if (diffMinutos < 0) diffMinutos += 24 * 60; // Caso o horário passe da meia-noite
      
      const horasDoBloco = diffMinutos / 60;

      return {
        id: bloco.id,
        professorId: bloco.professorId,
        dia_semana: bloco.dia_semana,
        hora_inicio: bloco.hora_inicio,
        hora_fim: bloco.hora_fim,
        preco: bloco.preco,
        duracao_aula: professor.duracao_aula, // <-- Injetado aqui como você pediu!
        tempo_bloco_horas: horasDoBloco // <-- Bônus para facilitar seu Frontend!
      };
    });

    return {
      duracao_aula: professor.duracao_aula,
      intervalo_aula: professor.intervalo_aula,
      preco_medio: professor.preco_medio,
      horarios_configurados: blocosFormatados,
    };
  }
}