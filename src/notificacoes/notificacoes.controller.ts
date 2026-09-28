import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async listar(@Request() req) {
    return this.notificacoesService.listar(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/ler')
  async marcarComoLida(@Request() req, @Param('id') id: string) {
    return this.notificacoesService.marcarComoLida(id, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('ler-todas')
  async marcarTodasComoLidas(@Request() req) {
    return this.notificacoesService.marcarTodasComoLidas(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remover(@Request() req, @Param('id') id: string) {
    return this.notificacoesService.remover(id, req.user.sub);
  }
}
