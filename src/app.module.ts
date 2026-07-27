import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CursosModule } from './cursos/cursos.module';
import { AulasModule } from './aulas/aulas.module';

@Module({
  imports: [AuthModule, CursosModule, AulasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
