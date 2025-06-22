import { IsInt, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterRestaurantOrdersDto {
  @ApiProperty({
    description: 'ID du statut pour filtrer les commandes',
    required: false,
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
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  page?: number;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page pour la pagination",
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  limit?: number;
}