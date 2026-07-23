import { Body, Controller, HttpCode, HttpStatus, Post, Get, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Não esqueça de importar o UpdateProfileDto lá em cima!
  
  @UseGuards(AuthGuard)
  @Patch('perfil')
  async atualizarPerfil(@Request() req, @Body() updateDto: UpdateProfileDto) {
    // O Guard garante que req.user existe e tem os dados do token (sub = ID, role = ALUNO/PROFESSOR)
    return this.authService.updateProfile(req.user.sub, req.user.role, updateDto);
  }

  @UseGuards(AuthGuard)
  @Delete('perfil')
  async excluirConta(@Request() req) {
    return this.authService.deleteAccount(req.user.sub);
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