import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CursosModule } from './cursos/cursos.module';
import { AulasModule } from './aulas/aulas.module';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { UploadModule } from './upload/upload.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { AvaliacoesModule } from './avaliacoes/avaliacoes.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule, CursosModule, AulasModule, AgendamentosModule, UploadModule, PagamentosModule,
    AvaliacoesModule, NotificacoesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}