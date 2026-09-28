import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @UseGuards(AuthGuard)
  @Post()
  async publicarCurso(@Request() req, @Body() dto: CreateCursoDto) {
    if (req.user.role !== 'PROFESSOR') throw new UnauthorizedException('Apenas professores podem criar cursos.');
    return this.cursosService.criarCurso(req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get('meus')
  async listarMeusCursos(@Request() req) { return this.cursosService.listarMeusCursos(req.user.sub); }

  @Get('destaque')
  async getDestaque() { return this.cursosService.obterDestaque(); }

  @Get()
  async listarTodos() { return this.cursosService.listarTodos(); }

  @Get(':id')
  async obterCurso(@Param('id') id: string) { return this.cursosService.obterCurso(id); }

  @Patch(':id/clique')
  async registrarClique(@Param('id') id: string) { return this.cursosService.registrarClique(id); }

  @UseGuards(AuthGuard)
  @Post(':id/matricular')
  async matricular(@Request() req, @Param('id') id: string) { return this.cursosService.matricularAluno(req.user.sub, id); }

  @UseGuards(AuthGuard)
  @Post('aulas/:aulaId/duvidas')
  async adicionarDuvida(@Request() req, @Param('aulaId') aulaId: string, @Body() body: { texto: string }) {
    return this.cursosService.adicionarDuvida(req.user.sub, aulaId, body.texto);
  }

  @UseGuards(AuthGuard)
  @Post('aulas/:aulaId/progresso')
  async registrarProgresso(@Request() req, @Param('aulaId') aulaId: string) {
    return this.cursosService.registrarProgresso(req.user.sub, aulaId);
  }
}