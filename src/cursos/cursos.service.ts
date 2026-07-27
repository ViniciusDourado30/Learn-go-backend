import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCursoDto } from './dto/create-curso.dto';

@Injectable()
export class CursosService {
  constructor(private prisma: PrismaService) {}

  async criarCurso(userId: string, dto: CreateCursoDto) {
    const professor = await this.prisma.professorProfile.findUnique({
      where: { userId: userId },
    });

    if (!professor) {
      throw new UnauthorizedException('Apenas professores com perfil completo podem criar cursos.');
    }

    const curso = await this.prisma.curso.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        preco: dto.preco,
        categoria: dto.categoria,
        capa_url: dto.capa_url,
        professorId: professor.id,
        modulos: {
          create: dto.modulos.map(modulo => ({
            titulo: modulo.titulo,
            ordem: modulo.ordem,
            aulas: {
              create: modulo.aulas.map(aula => ({
                titulo: aula.titulo,
                video_url: aula.video_url,
                ordem: aula.ordem,
              }))
            }
          }))
        }
      },
      include: {
        modulos: {
          include: { aulas: true }
        }
      }
    });

    return { message: 'Curso publicado com sucesso!', curso };
  }
}