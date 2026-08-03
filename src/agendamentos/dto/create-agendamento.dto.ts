import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateAgendamentoDto {
  @IsString()
  @IsNotEmpty()
  professorId!: string;

  @IsString()
  @IsNotEmpty()
  data_aula!: string; // Ex: "2026-08-09"

  @IsString()
  @IsNotEmpty()
  hora_inicio!: string;

  @IsString()
  @IsNotEmpty()
  hora_fim!: string;

  @IsNumber()
  preco_cobrado!: number;

  @IsString()
  @IsOptional()
  assunto?: string;
}