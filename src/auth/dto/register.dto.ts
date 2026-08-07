import { IsString, IsEmail, IsEnum, IsNumber, IsOptional, MinLength } from 'class-validator';

export enum Role {
  ALUNO = 'ALUNO',
  PROFESSOR = 'PROFESSOR',
}

export class RegisterDto {
  @IsString()
  nome!: string;

  @IsString()
  sobrenome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(Role)
  role!: Role;

  @IsNumber()
  idade!: number;

  @IsString()
  pais!: string;

  @IsString()
  estado!: string;

  @IsString()
  cidade!: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  formacao?: string;

  @IsString()
  @IsOptional()
  linkedin?: string;
}