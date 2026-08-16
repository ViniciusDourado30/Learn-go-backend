import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CursosModule } from './cursos/cursos.module';
import { AulasModule } from './aulas/aulas.module';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule, CursosModule, AulasModule, AgendamentosModule, UploadModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}