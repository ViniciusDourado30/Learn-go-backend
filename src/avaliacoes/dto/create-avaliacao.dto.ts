import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateAvaliacaoDto {
  @IsString()
  professorId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  nota!: number;

  @IsOptional()
  @IsString()
  comentario?: string;
}
