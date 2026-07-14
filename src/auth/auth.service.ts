import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    // TODO: Substituir este bloco pela busca real no seu banco Supabase/PostgreSQL
    // Simulando um usuário retornado do banco de dados:
    const usuarioMock = {
      id: 'uuid-1234',
      email: 'aluno@gmail.com',
      // Hash simulado para a senha 'Digite123'
      senha_hash: await bcrypt.hash('Digite123', 10),
      tipo: 'aluno',
    };

    // 1. Verifica se o usuário existe (aqui estamos forçando o mock)
    if (email !== usuarioMock.email) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Compara a senha enviada no body com o hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, usuarioMock.senha_hash);

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Se deu tudo certo, gera o Token JWT com os dados do usuário
    const payload = {
      sub: usuarioMock.id,
      email: usuarioMock.email,
      tipo: usuarioMock.tipo,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: {
        id: usuarioMock.id,
        email: usuarioMock.email,
        tipo: usuarioMock.tipo,
      },
    };
  }
}
