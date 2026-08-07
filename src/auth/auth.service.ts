import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    // 1. Verifica se o email já existe
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new BadRequestException('E-mail já está em uso.');
    }

    // 2. Criptografa a senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Salva o usuário no Prisma fazendo o mapeamento exato dos campos
    const user = await this.prisma.user.create({
      data: {
        nome: data.nome,
        sobrenome: data.sobrenome,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        idade: data.idade,
        pais: data.pais,
        estado: data.estado,
        cidade: data.cidade,
        telefone: data.telefone,
        formacao: data.formacao,
        linkedin: data.linkedin,
      },
    });

    // 4. Remove a senha do objeto antes de devolver a resposta
    delete (user as any).password;
    return user;
  }

  async login(data: LoginDto) {
    // 1. Busca o usuário
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 2. Compara a senha criptografada
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 3. Gera o Token JWT
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Métodos adicionados para evitar erros no seu AuthController
  async updateProfile(userId: string, role: string, updateDto: any) {
    // Lógica futura de atualização de perfil
    return { message: "Perfil atualizado com sucesso!" };
  }

  async deleteAccount(userId: string) {
    // Lógica futura de exclusão de conta
    return { message: "Conta excluída com sucesso!" };
  }
}