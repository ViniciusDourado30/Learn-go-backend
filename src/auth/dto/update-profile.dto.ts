import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() sobrenome?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() pais?: string;
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() cidade?: string;
  @IsOptional() @IsString() ocupacao?: string;
  @IsOptional() @IsString() idioma?: string;
  @IsOptional() @IsString() sobre?: string;
  @IsOptional() @IsString() foto_url?: string;
}