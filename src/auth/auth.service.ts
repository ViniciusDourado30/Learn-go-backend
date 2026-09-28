import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

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

    // Cria o perfil automaticamente baseado no cargo
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
    const profile = role === 'ALUNO' 
      ? await this.prisma.alunoProfile.findUnique({ where: { userId } })
      : await this.prisma.professorProfile.findUnique({ where: { userId } });
    return { user: safeUser, profile };
  }

  async updateProfile(userId: string, role: string, updateDto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    // Campos que vão para a tabela User
    const userUpdate: any = {};
    if (updateDto.nome) userUpdate.nome = updateDto.nome;
    if (updateDto.sobrenome) userUpdate.sobrenome = updateDto.sobrenome;
    if (updateDto.telefone !== undefined) userUpdate.telefone = updateDto.telefone;
    if (updateDto.pais !== undefined) userUpdate.pais = updateDto.pais;
    if (updateDto.estado !== undefined) userUpdate.estado = updateDto.estado;
    if (updateDto.cidade !== undefined) userUpdate.cidade = updateDto.cidade;

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: userUpdate });
    }

    // Campos que vão para o perfil (sem email que não existe no profile)
    const { email, nome, sobrenome, ...profileFields } = updateDto;
    const baseData = {
      userId, 
      nome: updateDto.nome || user.nome, 
      sobrenome: updateDto.sobrenome || user.sobrenome, 
      idade: user.idade || 0, 
      pais: updateDto.pais || user.pais || '', 
      estado: updateDto.estado || user.estado || '', 
      cidade: updateDto.cidade || user.cidade || '' 
    };

    if (role === 'ALUNO') {
      await this.prisma.alunoProfile.upsert({ where: { userId }, update: profileFields, create: { ...baseData, ...profileFields } });
    } else {
      await this.prisma.professorProfile.upsert({ where: { userId }, update: profileFields, create: { ...baseData, ...profileFields } });
    }
    return { message: "Perfil atualizado com sucesso!" };
  }

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

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: "Conta excluída com sucesso!" };
  }

  async listarProfessores() {
    const profs = await this.prisma.professorProfile.findMany({ include: { user: { include: { respostas: true } } } });
    return profs.map(p => {
      const bonus = (p.user?.respostas?.length || 0) * 0.1;
      const finalRating = Math.min(5.0, (p.rating || 5.0) + bonus);
      return { ...p, rating: parseFloat(finalRating.toFixed(1)) };
    });
  }

  async obterProfessor(id: string) {
    const prof = await this.prisma.professorProfile.findUnique({ where: { id }, include: { user: { include: { respostas: true } } } });
    if (!prof) throw new NotFoundException('Professor não encontrado.');
    const bonus = (prof.user?.respostas?.length || 0) * 0.1;
    const finalRating = Math.min(5.0, (prof.rating || 5.0) + bonus);
    return { ...prof, rating: parseFloat(finalRating.toFixed(1)) };
  }
}