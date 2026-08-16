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
    delete (user as any).password;
    return user;
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
    const profile = role === 'ALUNO' 
      ? await this.prisma.alunoProfile.findUnique({ where: { userId } })
      : await this.prisma.professorProfile.findUnique({ where: { userId } });
    return { user, profile };
  }

  async updateProfile(userId: string, role: string, updateDto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário não encontrado');
    const baseData = { userId, nome: user.nome, sobrenome: user.sobrenome, idade: user.idade || 0, pais: user.pais || '', estado: user.estado || '', cidade: user.cidade || '' };
    
    // Atualiza tabela User base
    await this.prisma.user.update({
      where: { id: userId },
      data: { telefone: updateDto.telefone, pais: updateDto.pais, estado: updateDto.estado, cidade: updateDto.cidade }
    });

    if (role === 'ALUNO') {
      await this.prisma.alunoProfile.upsert({ where: { userId }, update: updateDto, create: { ...baseData, ...updateDto } });
    } else {
      await this.prisma.professorProfile.upsert({ where: { userId }, update: updateDto, create: { ...baseData, ...updateDto } });
    }
    return { message: "Perfil atualizado com sucesso!" };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: "Conta excluída com sucesso!" };
  }

  async listarProfessores() {
    return this.prisma.professorProfile.findMany({ include: { user: { select: { email: true } } } });
  }

  async obterProfessor(id: string) {
    const prof = await this.prisma.professorProfile.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
    if (!prof) throw new NotFoundException('Professor não encontrado.');
    return prof;
  }
}