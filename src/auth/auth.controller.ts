import { Body, Controller, HttpCode, HttpStatus, Post, Get, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
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
  async login(@Body() loginDto: LoginDto) { return this.authService.login(loginDto); }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) { return this.authService.register(registerDto); }
  
  // --- ROTAS DE RECUPERAÇÃO DE SENHA COM OTP REAL ---
  @HttpCode(HttpStatus.OK)
  @Post('solicitar-codigo')
  async solicitarCodigo(@Body() body: { email: string }) {
    return this.authService.solicitarCodigoRecuperacao(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verificar-codigo')
  async verificarCodigo(@Body() body: { email: string; codigo: string }) {
    return this.authService.verificarCodigo(body.email, body.codigo);
  }

  @HttpCode(HttpStatus.OK)
  @Post('redefinir-senha')
  async redefinirSenha(@Body() body: { email: string; codigo: string; novaSenha: string }) {
    return this.authService.redefinirSenhaComCodigo(body.email, body.codigo, body.novaSenha);
  }

  // --- SUPORTE / CONTATO ---
  @HttpCode(HttpStatus.OK)
  @Post('contato-suporte')
  async contatoSuporte(@Body() body: { email: string; subject: string; message: string }) {
    return this.authService.enviarContatoSuporte(body.email, body.subject, body.message);
  }

  @UseGuards(AuthGuard)
  @Patch('perfil')
  async atualizarPerfil(@Request() req, @Body() updateDto: UpdateProfileDto) { return this.authService.updateProfile(req.user.sub, req.user.role, updateDto); }

  @UseGuards(AuthGuard)
  @Patch('alterar-senha')
  async alterarSenha(@Request() req, @Body() body: { senhaAtual: string; novaSenha: string }) {
    return this.authService.changePassword(req.user.sub, body.senhaAtual, body.novaSenha);
  }

  @UseGuards(AuthGuard)
  @Delete('perfil')
  async excluirConta(@Request() req) { return this.authService.deleteAccount(req.user.sub); }

  @UseGuards(AuthGuard)
  @Get('perfil')
  getPerfil(@Request() req) { return this.authService.getProfile(req.user.sub, req.user.role); }

  @UseGuards(AuthGuard)
  @Get('professores')
  async listarProfessores() { return this.authService.listarProfessores(); }

  @UseGuards(AuthGuard)
  @Get('professores/:id')
  async obterProfessor(@Param('id') id: string) { return this.authService.obterProfessor(id); }

  @UseGuards(AuthGuard)
  @Get('atividade-semanal')
  async obterAtividadeSemanal(@Request() req) {
    return this.authService.obterAtividadeSemanal(req.user.sub, req.user.role);
  }
}