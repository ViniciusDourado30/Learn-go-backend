import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateAulaDto {
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  video_url?: string;

  @IsNumber()
  ordem!: number;
}

class CreateModuloDto {
  @IsString()
  titulo!: string;

  @IsNumber()
  ordem!: number;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAulaDto)
  aulas!: CreateAulaDto[];
}

export class CreateCursoDto {
  @IsString()
  titulo!: string;

  @IsString()
  descricao!: string;

  @IsNumber()
  preco!: number;

  @IsString()
  categoria!: string;

  @IsOptional()
  @IsString()
  capa_url?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModuloDto)
  modulos!: CreateModuloDto[];
}