import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  async listar(userId: string) {
    return this.prisma.notificacao.findMany({
      where: { userId },
      orderBy: { criado_em: 'desc' },
      take: 20
    });
  }

  async marcarComoLida(id: string, userId: string) {
    return this.prisma.notificacao.updateMany({
      where: { id, userId },
      data: { lida: true }
    });
  }

  async marcarTodasComoLidas(userId: string) {
    return this.prisma.notificacao.updateMany({
      where: { userId, lida: false },
      data: { lida: true }
    });
  }

  async remover(id: string, userId: string) {
    return this.prisma.notificacao.deleteMany({ where: { id, userId } });
  }

  async criar(userId: string, tipo: string, titulo: string, descricao: string) {
    return this.prisma.notificacao.create({
      data: { userId, tipo, titulo, descricao }
    });
  }
}
