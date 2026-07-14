import { Body, Controller, HttpCode, HttpStatus, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('criar-teste')
  async criarTeste() {
    return this.authService.criarAlunoTeste();
  }

  // --- NOVA ROTA PROTEGIDA PELO GUARD ---
  @UseGuards(AuthGuard)
  @Get('perfil')
  getPerfil(@Request() req) {
    // Se o código chegar aqui, significa que o Guard liberou a porta!
    return {
      mensagem: 'Acesso autorizado com sucesso!',
      dados_do_token: req.user,
    };
  }
}