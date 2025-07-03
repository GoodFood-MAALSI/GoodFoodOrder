import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterOrdersDto {
  @ApiPropertyOptional({
    description: 'ID du statut pour filtrer les commandes',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  status_id?: number;

  @ApiPropertyOptional({
    description: 'Numéro de la page pour la pagination',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page pour la pagination",
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 10;
}