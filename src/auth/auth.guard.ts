import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Acesso negado: Token não fornecido.');
    }
    
    try {
      // Valida o token usando a mesma chave secreta que criamos no módulo
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'CHAVE_SUPER_SECRETA_DO_TCC'
      });
      
      // Anexa os dados descriptografados do usuário na requisição
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Acesso negado: Token inválido ou expirado.');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}