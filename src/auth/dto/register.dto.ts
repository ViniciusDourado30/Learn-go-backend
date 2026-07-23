// src/auth/dto/register.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator';

export enum Role {
  ALUNO = 'ALUNO',
  PROFESSOR = 'PROFESSOR',
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  senha!: string;

  @IsEnum(Role)
  role!: Role;

  // Dados comuns
  @IsString()
  nome!: string;

  @IsString()
  sobrenome!: string;

  @IsNumber()
  idade!: number;

  @IsString()
  pais!: string;

  @IsString()
  estado!: string;

  @IsString()
  cidade!: string;

  // Biometria (o vetor que vem do frontend)
  @IsArray()
  @IsOptional()
  biometria_vector?: number[]; 

  // Apenas para Professor
  @IsOptional()
  @IsString()
  comprovante_url?: string;
}