import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  // 1. Gera o Token de Acesso do Zoom
  private async getAccessToken(): Promise<string> {
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
    const authString = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      {},
      { headers: { Authorization: `Basic ${authString}` } }
    );
    return response.data.access_token;
  }

  // 2. Cria a reunião
  async criarReuniao(topico: string, dataHoraInicioISO: string, duracaoMinutos: number) {
    const token = await this.getAccessToken();
    
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: topico,
        type: 2, // Reunião agendada
        start_time: dataHoraInicioISO, // Formato YYYY-MM-DDTHH:MM:SSZ
        duration: duracaoMinutos,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          waiting_room: true, // Segurança
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      zoomMeetingId: response.data.id.toString(),
      joinUrl: response.data.join_url,
    };
  }

  // 3. A MÁGICA: Auditoria antifraude. Chama o Zoom para ver quem participou!
  async verificarSeAulaAconteceu(zoomMeetingId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      
      // Busca o relatório de participantes desta reunião específica
      const response = await axios.get(
        `https://api.zoom.us/v2/report/meetings/${zoomMeetingId}/participants`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const participantes = response.data.participants;
      
      if (!participantes || participantes.length === 0) {
        return false; // Ninguém entrou
      }

      // Calcula o tempo total que as pessoas ficaram na sala
      let tempoTotalNaSala = 0;
      participantes.forEach((p: any) => {
        tempoTotalNaSala += p.duration; // O Zoom retorna em segundos
      });

      // REGRA DE NEGÓCIO: Se a soma do tempo do professor + aluno na sala 
      // for maior que X minutos (ex: 15 minutos = 900 segundos), a aula é validada.
      if (tempoTotalNaSala >= 900) {
        return true; // Aula aconteceu, pode pagar o professor!
      }

      return false; // Entraram e saíram rápido, ou o professor não foi
      
    } catch (error) {
      this.logger.error('Erro ao verificar relatório do Zoom', error);
      return false; 
    }
  }
}