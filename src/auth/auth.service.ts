import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  verified: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otps = new Map<string, OtpRecord>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(data: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) throw new BadRequestException('E-mail já está em uso.');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        nome: data.nome, sobrenome: data.sobrenome, email: data.email, password: hashedPassword,
        role: data.role, idade: data.idade, pais: data.pais, estado: data.estado,
        cidade: data.cidade, telefone: data.telefone, formacao: data.formacao, linkedin: data.linkedin,
      },
    });

    const baseProfile = {
      userId: user.id,
      nome: user.nome,
      sobrenome: user.sobrenome,
      idade: user.idade || 0,
      pais: user.pais || '',
      estado: user.estado || '',
      cidade: user.cidade || '',
      telefone: user.telefone,
    };

    if (data.role === 'PROFESSOR') {
      await this.prisma.professorProfile.create({ data: baseProfile });
    } else {
      await this.prisma.alunoProfile.create({ data: baseProfile });
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciais inválidas.');
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role },
    };
  }

  async getProfile(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    const { password: _, ...safeUser } = user;
    const isProf = role?.toUpperCase() === 'PROFESSOR';

    let stats: any = {};

    if (isProf) {
      const profile = await this.prisma.professorProfile.findUnique({ where: { userId } });
      if (profile) {
        const idiomaStr = (profile.idiomas && profile.idiomas.length > 0) ? profile.idiomas.join(', ') : '';
        (profile as any).idioma = idiomaStr;
        if (!profile.pais && user.pais) profile.pais = user.pais;
        if (!profile.estado && user.estado) profile.estado = user.estado;
        if (!profile.cidade && user.cidade) profile.cidade = user.cidade;

        const cursos = await this.prisma.curso.findMany({ where: { professorId: profile.id }, select: { id: true } });
        const cursoIds = cursos.map(c => c.id);
        const totalMatriculas = cursoIds.length > 0 ? await this.prisma.matriculaCurso.count({ where: { cursoId: { in: cursoIds } } }) : 0;
        const totalAulasDadas = await this.prisma.aulaAgendada.count({
          where: { professorId: profile.id, status: { notIn: ['CANCELADA', 'CANCELADA_REEMBOLSADA'] } }
        });

        stats = {
          cursosPublicados: cursos.length,
          avaliacaoMedia: profile.rating || 5.0,
          totalReviews: profile.total_reviews || 0,
          alunosAtivos: totalMatriculas + totalAulasDadas,
        };
      }
      return { user: safeUser, profile, stats };
    } else {
      const profile = await this.prisma.alunoProfile.findUnique({ where: { userId } });
      if (profile) {
        if (!profile.pais && user.pais) profile.pais = user.pais;
        if (!profile.estado && user.estado) profile.estado = user.estado;
        if (!profile.cidade && user.cidade) profile.cidade = user.cidade;
      }
      const cursosAtivos = await this.prisma.matriculaCurso.count({ where: { alunoId: userId } });
      const aulasConcluidas = await this.prisma.progressoAula.count({ where: { alunoId: userId, concluida: true } });
      const atividade = await this.obterAtividadeSemanal(userId, role);

      stats = {
        cursosAtivos,
        aulasConcluidas,
        tempoTotalHoras: atividade.totalHoras,
      };
      return { user: safeUser, profile, stats };
    }
  }

  async updateProfile(userId: string, role: string, updateDto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    // Campos que vão para a tabela User
    const userUpdate: any = {};
    if (updateDto.nome) userUpdate.nome = updateDto.nome;
    if (updateDto.sobrenome) userUpdate.sobrenome = updateDto.sobrenome;
    if (updateDto.telefone !== undefined) userUpdate.telefone = updateDto.telefone;
    if (updateDto.pais) userUpdate.pais = updateDto.pais;
    if (updateDto.estado) userUpdate.estado = updateDto.estado;
    if (updateDto.cidade) userUpdate.cidade = updateDto.cidade;

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: userUpdate });
    }

    const baseData = {
      userId, 
      nome: updateDto.nome || user.nome, 
      sobrenome: updateDto.sobrenome || user.sobrenome, 
      idade: user.idade || 0, 
      pais: updateDto.pais || user.pais || '', 
      estado: updateDto.estado || user.estado || '', 
      cidade: updateDto.cidade || user.cidade || '',
      telefone: updateDto.telefone !== undefined ? updateDto.telefone : user.telefone,
    };

    const isProf = role?.toUpperCase() === 'PROFESSOR';

    if (isProf) {
      const profData: any = {};
      if (updateDto.nome) profData.nome = updateDto.nome;
      if (updateDto.sobrenome) profData.sobrenome = updateDto.sobrenome;
      if (updateDto.telefone !== undefined) profData.telefone = updateDto.telefone;
      if (updateDto.pais) profData.pais = updateDto.pais;
      if (updateDto.estado) profData.estado = updateDto.estado;
      if (updateDto.cidade) profData.cidade = updateDto.cidade;
      if (updateDto.sobre !== undefined) profData.sobre = updateDto.sobre;
      if (updateDto.ocupacao !== undefined) profData.ocupacao = updateDto.ocupacao;
      if (updateDto.foto_url !== undefined) profData.foto_url = updateDto.foto_url;
      
      if (updateDto.idioma !== undefined) {
        const list = updateDto.idioma ? updateDto.idioma.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        profData.idiomas = list;
      } else if (Array.isArray(updateDto.idiomas)) {
        profData.idiomas = updateDto.idiomas;
      }
      if (Array.isArray(updateDto.especialidades)) {
        profData.especialidades = updateDto.especialidades;
      }

      await this.prisma.professorProfile.upsert({
        where: { userId },
        update: profData,
        create: { ...baseData, ...profData }
      });
    } else {

      const alunoData: any = {};
      if (updateDto.nome) alunoData.nome = updateDto.nome;
      if (updateDto.sobrenome) alunoData.sobrenome = updateDto.sobrenome;
      if (updateDto.telefone !== undefined) alunoData.telefone = updateDto.telefone;
      if (updateDto.pais) alunoData.pais = updateDto.pais;
      if (updateDto.estado) alunoData.estado = updateDto.estado;
      if (updateDto.cidade) alunoData.cidade = updateDto.cidade;
      if (updateDto.sobre !== undefined) alunoData.sobre = updateDto.sobre;
      if (updateDto.ocupacao !== undefined) alunoData.ocupacao = updateDto.ocupacao;
      if (updateDto.foto_url !== undefined) alunoData.foto_url = updateDto.foto_url;
      if (updateDto.idioma !== undefined) alunoData.idioma = updateDto.idioma;
      if (Array.isArray(updateDto.interesses)) alunoData.interesses = updateDto.interesses;
      if (updateDto.objetivo !== undefined) alunoData.objetivo = updateDto.objetivo;

      await this.prisma.alunoProfile.upsert({
        where: { userId },
        update: alunoData,
        create: { ...baseData, ...alunoData }
      });
    }

    return { message: "Perfil atualizado com sucesso!" };
  }

  async solicitarCodigoRecuperacao(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) throw new BadRequestException('E-mail não cadastrado na plataforma.');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

    this.otps.set(cleanEmail, {
      code,
      email: cleanEmail,
      expiresAt,
      verified: false,
    });

    const result = await this.emailService.enviarCodigoRecuperacao(cleanEmail, code);
    return {
      message: 'Código de verificação enviado com sucesso!',
      email: cleanEmail,
      previewUrl: result?.previewUrl || undefined,
      codigoDemo: code,
    };
  }

  async verificarCodigo(email: string, codigo: string) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = (codigo || '').trim();

    const record = this.otps.get(cleanEmail);
    if (!record) {
      throw new BadRequestException('Nenhum código foi solicitado para este e-mail. Solicite um novo código.');
    }

    if (Date.now() > record.expiresAt) {
      this.otps.delete(cleanEmail);
      throw new BadRequestException('O código expirou. Solicite um novo código.');
    }

    if (record.code !== cleanCode) {
      throw new BadRequestException('Código incorreto. Digite o código de 6 dígitos recebido.');
    }

    record.verified = true;
    return { success: true, message: 'Código verificado com sucesso!' };
  }

  // Redefinição de senha - gravação da nova senha
  async redefinirSenhaComCodigo(email: string, codigo: string, novaSenha: string) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = (codigo || '').trim();

    const record = this.otps.get(cleanEmail);
    if (!record || record.code !== cleanCode || !record.verified) {
      throw new BadRequestException('Código não validado ou expirado. Por favor, verifique o código novamente.');
    }

    if (Date.now() > record.expiresAt) {
      this.otps.delete(cleanEmail);
      throw new BadRequestException('O código expirou. Solicite um novo código.');
    }

    if (!novaSenha || novaSenha.length < 6) {
      throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres.');
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    await this.prisma.user.update({
      where: { email: cleanEmail },
      data: { password: hashedPassword }
    });

    this.otps.delete(cleanEmail);
    return { message: 'Senha redefinida com sucesso!' };
  }

  // Alteração de senha para usuário autenticado
  async changePassword(userId: string, senhaAtual: string, novaSenha: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const isValid = await bcrypt.compare(senhaAtual, user.password);
    if (!isValid) throw new UnauthorizedException('Senha atual incorreta.');

    if (novaSenha.length < 6) throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres.');

    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    return { message: 'Senha alterada com sucesso!' };
  }

  // Exclusão definitiva de conta do usuário
  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: "Conta excluída com sucesso!" };
  }

  // Listagem pública de professores cadastrados
  async listarProfessores() {
    const profs = await this.prisma.professorProfile.findMany({ include: { user: { include: { respostas: true } } } });
    return profs.map(p => {
      const bonus = (p.user?.respostas?.length || 0) * 0.1;
      const finalRating = Math.min(5.0, (p.rating || 5.0) + bonus);
      return { ...p, rating: parseFloat(finalRating.toFixed(1)) };
    });
  }

  // Detalhes do perfil do professor por ID
  async obterProfessor(id: string) {
    const prof = await this.prisma.professorProfile.findUnique({ where: { id }, include: { user: { include: { respostas: true } } } });
    if (!prof) throw new NotFoundException('Professor não encontrado.');
    const bonus = (prof.user?.respostas?.length || 0) * 0.1;
    const finalRating = Math.min(5.0, (prof.rating || 5.0) + bonus);
    return { ...prof, rating: parseFloat(finalRating.toFixed(1)) };
  }

  // Contato com suporte por e-mail
  async enviarContatoSuporte(email: string, assunto: string, mensagem: string) {
    if (!assunto?.trim() || !mensagem?.trim()) {
      throw new BadRequestException('Assunto e mensagem são obrigatórios.');
    }
    const result = await this.emailService.enviarContatoSuporte(email, assunto, mensagem);
    return {
      message: 'Mensagem enviada com sucesso para nossa equipe!',
      previewUrl: result?.previewUrl || undefined,
    };
  }

  // Atividade semanal - cálculo dinâmico de horas de estudo e aulas por dia
  async obterAtividadeSemanal(userId: string, role: string) {
    const agora = new Date();
    const diaSemanaHoje = agora.getDay(); // 0 = Domingo, 1 = Segunda, ...
    const distSegunda = diaSemanaHoje === 0 ? -6 : 1 - diaSemanaHoje;
    
    const segunda = new Date(agora);
    segunda.setDate(agora.getDate() + distSegunda);
    segunda.setHours(0, 0, 0, 0);

    const diasNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const weeklyActivity: { day: string; hours: number; date: string }[] = [];

    let profProfileId: string | null = null;
    const isProf = role?.toUpperCase() === 'PROFESSOR';
    if (isProf) {
      const prof = await this.prisma.professorProfile.findUnique({ where: { userId } });
      if (prof) profProfileId = prof.id;
    }

    for (let i = 0; i < 7; i++) {
      const diaAtual = new Date(segunda);
      diaAtual.setDate(segunda.getDate() + i);
      const ano = diaAtual.getFullYear();
      const mes = String(diaAtual.getMonth() + 1).padStart(2, '0');
      const dia = String(diaAtual.getDate()).padStart(2, '0');
      const dataStr = `${ano}-${mes}-${dia}`;

      const inicioDia = new Date(ano, diaAtual.getMonth(), diaAtual.getDate(), 0, 0, 0);
      const fimDia = new Date(ano, diaAtual.getMonth(), diaAtual.getDate(), 23, 59, 59, 999);

      let horasOnline = 0;
      let horasGravadas = 0;

      if (isProf && profProfileId) {
        const aulasOnline = await this.prisma.aulaAgendada.findMany({
          where: {
            professorId: profProfileId,
            data_aula: dataStr,
            status: { notIn: ['CANCELADA', 'CANCELADA_REEMBOLSADA'] }
          }
        });
        horasOnline = aulasOnline.length * 1.0;
      } else {
        const aulasOnline = await this.prisma.aulaAgendada.findMany({
          where: {
            alunoId: userId,
            data_aula: dataStr,
            status: { notIn: ['CANCELADA', 'CANCELADA_REEMBOLSADA'] }
          }
        });
        horasOnline = aulasOnline.length * 1.0;
      }

      const progressos = await this.prisma.progressoAula.findMany({
        where: {
          alunoId: userId,
          concluida: true,
          criado_em: { gte: inicioDia, lte: fimDia }
        },
        include: { aula: { select: { duracao_minutos: true } } }
      });

      if (progressos.length > 0) {
        const minutosGravados = progressos.reduce((acc, p) => acc + (p.aula?.duracao_minutos || 20), 0);
        horasGravadas = minutosGravados / 60;
      }

      let totalDia = Math.round((horasOnline + horasGravadas) * 10) / 10;
      if (totalDia === 0 && (horasOnline > 0 || horasGravadas > 0)) {
        totalDia = 0.3;
      }

      weeklyActivity.push({
        day: diasNomes[i],
        hours: totalDia,
        date: dataStr
      });
    }

    const totalHoras = Math.round(weeklyActivity.reduce((acc, d) => acc + d.hours, 0) * 10) / 10;

    return {
      totalHoras,
      weeklyActivity
    };
  }
}