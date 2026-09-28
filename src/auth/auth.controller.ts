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
}