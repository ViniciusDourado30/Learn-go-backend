import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    const aluno = await this.prisma.aluno.findUnique({
      where: { email },
    });

    if (!aluno) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(senha, aluno.senha_hash);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: aluno.id,
      email: aluno.email,
      tipo: 'aluno',
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: {
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        status: aluno.status_conta,
      },
    };
  }

  // --- ROTA TEMPORÁRIA PARA O TESTE ---
  async criarAlunoTeste() {
    // 1. Gera o hash de segurança para a senha 'Senha123'
    const senhaCriptografada = await bcrypt.hash('Senha123', 10);

    // 2. Salva o usuário no Supabase
    const aluno = await this.prisma.aluno.create({
      data: {
        cpf: '12345678901',
        nome: 'Aluno de Teste TCC',
        email: 'aluno@teste.com',
        senha_hash: senhaCriptografada,
      },
    });

    return { mensagem: 'Aluno criado com sucesso no banco!', aluno };
  }
}