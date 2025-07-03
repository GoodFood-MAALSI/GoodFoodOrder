import { IsInt, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterDelivererOrdersDto {
  @ApiPropertyOptional({
    description: 'ID du statut (≥ 3) pour filtrer les commandes',
    type: Number,
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(3, { message: 'Le statut doit être supérieur ou égal à 3' })
  @Type(() => Number)
  status_id?: number;

  @ApiPropertyOptional({
    description: 'Numéro de la page pour la pagination',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  page?: number;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  limit?: number;
}
