import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';

@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  @UseGuards(AuthGuard)
  @Post()
  async criarAgendamento(@Request() req, @Body() dto: CreateAgendamentoDto) {
    return this.agendamentosService.agendarAula(req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get('minhas-aulas')
  async buscarMinhasAulas(@Request() req) {
    return this.agendamentosService.listarAulasDoAluno(req.user.sub);
  }

  // Rota para a aba "Agenda" quando quem estiver logado for o Professor
  @UseGuards(AuthGuard)
  @Get('aulas-professor')
  async buscarAulasDoProfessor(@Request() req) {
    return this.agendamentosService.listarAulasDoProfessor(req.user.sub);
  }

  // Rota para o Front-end consultar o que desativar (disabled)
  @Get('ocupados')
  async horáriosOcupados(
    @Query('professorId') professorId: string,
    @Query('data') data: string,
  ) {
    return this.agendamentosService.buscarHorariosOcupados(professorId, data);
  }
}