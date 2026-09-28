import { Controller, Post, Get, Param, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AvaliacoesService } from './avaliacoes.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private readonly avaliacoesService: AvaliacoesService) {}

  @UseGuards(AuthGuard)
  @Post()
  async criarAvaliacao(@Request() req, @Body() dto: CreateAvaliacaoDto) {
    return this.avaliacoesService.criarAvaliacao(req.user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Get('professor/:id')
  async listarAvaliacoes(@Param('id') id: string) {
    return this.avaliacoesService.listarAvaliacoesProfessor(id);
  }
}
