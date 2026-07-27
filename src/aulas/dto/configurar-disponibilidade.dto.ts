import { IsNumber, IsString, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BlocoHorarioDto {
  @IsString()
  hora_inicio!: string;

  @IsString()
  hora_fim!: string;

  @IsNumber()
  @Min(0)
  preco!: number;
}

export class DiaDisponivelDto {
  @IsNumber()
  @Min(0)
  @Max(6) // 0 a 6 (Dom a Sáb)
  dia_semana!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlocoHorarioDto)
  blocos!: BlocoHorarioDto[];
}

export class ConfigurarDisponibilidadeDto {
  @IsNumber()
  duracao_aula!: number;

  @IsNumber()
  intervalo_aula!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiaDisponivelDto)
  dias!: DiaDisponivelDto[];
}