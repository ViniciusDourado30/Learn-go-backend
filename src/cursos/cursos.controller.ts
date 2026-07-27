import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @UseGuards(AuthGuard)
  @Post()
  async publicarCurso(@Request() req, @Body() dto: CreateCursoDto) {
    if (req.user.role !== 'PROFESSOR') {
      throw new UnauthorizedException('Apenas professores podem criar cursos.');
    }

    return this.cursosService.criarCurso(req.user.sub, dto);
  }
}