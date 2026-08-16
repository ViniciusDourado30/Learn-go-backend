import { Controller, Post, Get, Param, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AulasService } from './aulas.service';
import { ConfigurarDisponibilidadeDto } from './dto/configurar-disponibilidade.dto';

@Controller('aulas')
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @UseGuards(AuthGuard)
  @Post('disponibilidade')
  async salvarHorarios(@Request() req, @Body() dto: ConfigurarDisponibilidadeDto) {
    if (req.user.role !== 'PROFESSOR') throw new UnauthorizedException('Apenas professores podem configurar horários.');
    return this.aulasService.configurarDisponibilidade(req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get('disponibilidade')
  async buscarHorarios(@Request() req) {
    if (req.user.role !== 'PROFESSOR') throw new UnauthorizedException('Apenas professores possuem horários configurados.');
    return this.aulasService.obterDisponibilidade(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('disponibilidade/:professorId')
  async buscarHorariosPublicos(@Param('professorId') professorId: string) {
    return this.aulasService.obterDisponibilidadePublica(professorId);
  }
}