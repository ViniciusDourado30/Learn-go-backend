import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Agora comparamos com o campo 'senha_hash' da tabela 'user'
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const { senha, email, role, biometria_vector, ...profileData } = dto;
    const senha_hash = await bcrypt.hash(senha, 10);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Cria o Usuário base
      const user = await tx.user.create({
        data: { email, senha_hash, role },
      });

      // 2. Cria o perfil dependendo do Role
      if (role === 'ALUNO') {
        await tx.alunoProfile.create({
          data: { userId: user.id, ...profileData },
        });
      } else {
        await tx.professorProfile.create({
          data: { userId: user.id, ...profileData },
        });
      }

      // 3. Inserção do Vetor Biométrico (Raw Query necessária por causa do 'Unsupported')
      if (biometria_vector) {
        const tableName = role === 'ALUNO' ? 'aluno_profiles' : 'professor_profiles';
        await tx.$executeRawUnsafe(
          `UPDATE "${tableName}" SET biometria_vector = '[${biometria_vector.join(',')}]'::vector WHERE "userId" = $1`,
          user.id
        );
      }

      return { message: 'Cadastro realizado com sucesso!', userId: user.id };
    });
  }

  async updateProfile(userId: string, role: string, dto: any) {
    const { email, ...profileData } = dto;

    return await this.prisma.$transaction(async (tx: any) => {
      // 1. Se o usuário alterou o e-mail, atualiza na tabela base
      if (email) {
        await tx.user.update({
          where: { id: userId },
          data: { email },
        });
      }

      // 2. Se enviou outros dados (foto, nome, ocupação), atualiza o perfil
      if (Object.keys(profileData).length > 0) {
        const tableName = role === 'ALUNO' ? 'alunoProfile' : 'professorProfile';
        await tx[tableName].update({
          where: { userId },
          data: profileData,
        });
      }

      return { message: 'Perfil atualizado com sucesso!' };
    });
  }

  // --- EXCLUIR CONTA ---
  async deleteAccount(userId: string) {
    // Graças ao onDelete: Cascade no schema, deletar o User limpa o perfil automaticamente!
    await this.prisma.user.delete({
      where: { id: userId },
    });
    
    return { message: 'Conta excluída permanentemente.' };
  }
}