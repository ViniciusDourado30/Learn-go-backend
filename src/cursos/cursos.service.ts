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
    const cursos = await this.prisma.curso.findMany({ include: { professor: true, modulos: { include: { aulas: true }, orderBy: { ordem: 'asc' } } }, orderBy: { criado_em: 'desc' } });
    return cursos.map(c => {
      const duracao_total_minutos = c.modulos.reduce((acc, m) => acc + m.aulas.reduce((a, aula) => a + (aula.duracao_minutos || 0), 0), 0);
      return { ...c, duracao_total_minutos };
    });
  }

  async obterDestaque() {
    const curso = await this.prisma.curso.findFirst({ orderBy: { cliques: 'desc' }, include: { professor: true, modulos: { include: { aulas: true }, orderBy: { ordem: 'asc' } } } });
    if (!curso) throw new NotFoundException('Nenhum curso encontrado.');
    const duracao_total_minutos = curso.modulos.reduce((acc, m) => acc + m.aulas.reduce((a, aula) => a + (aula.duracao_minutos || 0), 0), 0);
    return { ...curso, duracao_total_minutos };
  }

  async registrarClique(cursoId: string) {
    return this.prisma.curso.update({ where: { id: cursoId }, data: { cliques: { increment: 1 } } });
  }

  async obterCurso(id: string) {
    const curso = await this.prisma.curso.findUnique({ where: { id }, include: { professor: true, modulos: { include: { aulas: { include: { materiais: true, progressos: true, duvidas: { include: { aluno: true, respostas: { include: { autor: true } } } } } } }, orderBy: { ordem: 'asc' } } } });
    if (!curso) throw new NotFoundException('Curso não encontrado.');
    const duracao_total_minutos = curso.modulos.reduce((acc, m) => acc + m.aulas.reduce((a, aula) => a + (aula.duracao_minutos || 0), 0), 0);
    return { ...curso, duracao_total_minutos };
  }

  async matricularAluno(userId: string, cursoId: string) {
    const curso = await this.prisma.curso.findUnique({ where: { id: cursoId } });
    if (!curso) throw new NotFoundException('Curso não encontrado.');
    
    const existe = await this.prisma.matriculaCurso.findUnique({ where: { alunoId_cursoId: { alunoId: userId, cursoId: cursoId } } });
    if (existe) throw new BadRequestException('Aluno já matriculado neste curso.');

    return this.prisma.matriculaCurso.create({ data: { alunoId: userId, cursoId: cursoId } });
  }

  async listarMeusCursos(userId: string) {
    const matriculas = await this.prisma.matriculaCurso.findMany({ where: { alunoId: userId }, include: { curso: { include: { professor: true, modulos: { include: { aulas: { include: { materiais: true, progressos: true, duvidas: { include: { aluno: true, respostas: { include: { autor: true } } } } } } } } } } } });
    return matriculas.map(m => {
      const duracao_total_minutos = m.curso.modulos.reduce((acc, mod) => acc + mod.aulas.reduce((a, aula) => a + (aula.duracao_minutos || 0), 0), 0);
      return { ...m.curso, progress: m.progresso, duracao_total_minutos };
    });
  }

  async adicionarDuvida(userId: string, aulaId: string, texto: string) {
    return this.prisma.duvidaAula.create({
      data: {
        texto,
        aulaId,
        alunoId: userId
      },
      include: { aluno: true, respostas: { include: { autor: true } } }
    });
  }

  async registrarProgresso(userId: string, aulaId: string) {
    return this.prisma.progressoAula.upsert({
      where: { alunoId_aulaId: { alunoId: userId, aulaId } },
      update: { concluida: true },
      create: { alunoId: userId, aulaId, concluida: true }
    });
  }
}