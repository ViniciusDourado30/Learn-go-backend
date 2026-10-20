import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configurado com sucesso para ${user}@${host}`);
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.logger.log(`Ethereal SMTP de teste inicializado: ${testAccount.user}`);
      } catch (err) {
        this.logger.warn(`Não foi possível iniciar Ethereal test account: ${err}`);
      }
    }
  }

  async enviarCodigoRecuperacao(destinatario: string, codigo: string): Promise<{ success: boolean; previewUrl?: string | false }> {
    this.logger.log(`\n==================================================`);
    this.logger.log(`🔑 [OTP Learn&Go] CÓDIGO DE RECUPERAÇÃO`);
    this.logger.log(`Destinatário: ${destinatario}`);
    this.logger.log(`Código OTP: >>> ${codigo} <<<`);
    this.logger.log(`Válido por: 10 minutos`);
    this.logger.log(`==================================================\n`);

    if (!this.transporter) {
      await this.initTransporter();
    }

    if (!this.transporter) {
      return { success: true };
    }

    try {
      const from = process.env.SMTP_FROM || '"Learn&Go Suporte" <suporte@learngo.com>';
      const info = await this.transporter.sendMail({
        from,
        to: destinatario,
        subject: `Learn&Go - Código de verificação: ${codigo}`,
        text: `Olá!\n\nSeu código de verificação para redefinir a senha do Learn&Go é: ${codigo}\n\nEste código expira em 10 minutos.\n\nSe você não solicitou esta redefinição, ignore este e-mail.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; rounded: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #006FEE; margin: 0;">Learn&Go</h2>
              <p style="color: #71717a; font-size: 14px;">Plataforma de Cursos e Mentorias</p>
            </div>
            <h3 style="color: #09090b; margin-bottom: 12px;">Redefinição de senha</h3>
            <p style="color: #3f3f46; font-size: 14px; line-height: 1.5;">
              Você solicitou um código de verificação para redefinir sua senha de acesso. Use o código abaixo no aplicativo:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #006FEE; background: #eff6ff; padding: 14px 28px; border-radius: 12px; border: 1px dashed #006FEE;">
                ${codigo}
              </span>
            </div>
            <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
              Este código é válido por 10 minutos. Nunca compartilhe este código com ninguém.
            </p>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`Preview do e-mail (Ethereal): ${previewUrl}`);
      }
      return { success: true, previewUrl };
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail OTP para ${destinatario}:`, error);
      return { success: true };
    }
  }

  async enviarContatoSuporte(remetente: string, assunto: string, mensagem: string): Promise<{ success: boolean; previewUrl?: string | false }> {
    const destinoSuporte = 'vinicius.dourado30@outlook.com';

    this.logger.log(`\n==================================================`);
    this.logger.log(`📩 [Suporte Learn&Go] NOVA MENSAGEM RECEBIDA`);
    this.logger.log(`Para: ${destinoSuporte}`);
    this.logger.log(`De: ${remetente}`);
    this.logger.log(`Assunto: ${assunto}`);
    this.logger.log(`Mensagem: ${mensagem}`);
    this.logger.log(`==================================================\n`);

    if (!this.transporter) {
      await this.initTransporter();
    }

    if (!this.transporter) {
      return { success: true };
    }

    try {
      const from = process.env.SMTP_FROM || '"Learn&Go Suporte" <suporte@learngo.com>';
      const info = await this.transporter.sendMail({
        from,
        to: destinoSuporte,
        replyTo: remetente,
        subject: `[Suporte Learn&Go] ${assunto} (De: ${remetente})`,
        text: `Nova mensagem recebida pela Central de Ajuda do Learn&Go:\n\nRemetente: ${remetente}\nAssunto: ${assunto}\n\nMensagem:\n${mensagem}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px;">
            <h2 style="color: #006FEE; margin-top: 0;">Nova mensagem de suporte Learn&Go</h2>
            <p><strong>Remetente:</strong> ${remetente}</p>
            <p><strong>Assunto:</strong> ${assunto}</p>
            <div style="margin-top: 16px; padding: 16px; background: #fafafa; border-radius: 8px; border-left: 4px solid #006FEE;">
              <p style="white-space: pre-wrap; margin: 0; color: #18181b;">${mensagem}</p>
            </div>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`Preview do e-mail de suporte (Ethereal): ${previewUrl}`);
      }
      return { success: true, previewUrl };
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail de suporte para ${destinoSuporte}:`, error);
      return { success: true };
    }
  }
}
