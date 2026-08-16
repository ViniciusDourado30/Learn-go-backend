import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCursoDto } from './dto/create-curso.dto';

@Injectable()
export class CursosService {
  constructor(private prisma: PrismaService) {}

  async criarCurso(userId: string, dto: CreateCursoDto) {
    const professor = await this.prisma.professorProfile.findUnique({ where: { userId: userId } });
    if (!professor) throw new UnauthorizedException('Apenas professores podem criar cursos.');

    const curso = await this.prisma.curso.create({
      data: {
        titulo: dto.titulo, descricao: dto.descricao, preco: dto.preco, categoria: dto.categoria, capa_url: dto.capa_url, professorId: professor.id,
        modulos: {
          create: dto.modulos.map(modulo => ({
            titulo: modulo.titulo, ordem: modulo.ordem,
            aulas: { create: modulo.aulas.map(aula => ({ titulo: aula.titulo, video_url: aula.video_url, ordem: aula.ordem })) }
          }))
        }
      },
      include: { modulos: { include: { aulas: true } } }
    });
    return { message: 'Curso publicado com sucesso!', curso };
  }

  async listarTodos() {
    return this.prisma.curso.findMany({ include: { professor: true }, orderBy: { criado_em: 'desc' } });
  }

  async obterDestaque() {
    const curso = await this.prisma.curso.findFirst({ orderBy: { cliques: 'desc' }, include: { professor: true } });
    if (!curso) throw new NotFoundException('Nenhum curso encontrado.');
    return curso;
  }

  async registrarClique(cursoId: string) {
    return this.prisma.curso.update({ where: { id: cursoId }, data: { cliques: { increment: 1 } } });
  }

  async obterCurso(id: string) {
    const curso = await this.prisma.curso.findUnique({ where: { id }, include: { professor: true, modulos: { include: { aulas: true }, orderBy: { ordem: 'asc' } } } });
    if (!curso) throw new NotFoundException('Curso não encontrado.');
    return curso;
  }

  async matricularAluno(userId: string, cursoId: string) {
    const curso = await this.prisma.curso.findUnique({ where: { id: cursoId } });
    if (!curso) throw new NotFoundException('Curso não encontrado.');
    
    const existe = await this.prisma.matriculaCurso.findUnique({ where: { alunoId_cursoId: { alunoId: userId, cursoId: cursoId } } });
    if (existe) throw new BadRequestException('Aluno já matriculado neste curso.');

    return this.prisma.matriculaCurso.create({ data: { alunoId: userId, cursoId: cursoId } });
  }

  async listarMeusCursos(userId: string) {
    const matriculas = await this.prisma.matriculaCurso.findMany({ where: { alunoId: userId }, include: { curso: { include: { professor: true, modulos: { include: { aulas: true } } } } } });
    return matriculas.map(m => ({ ...m.curso, progress: m.progresso }));
  }
}