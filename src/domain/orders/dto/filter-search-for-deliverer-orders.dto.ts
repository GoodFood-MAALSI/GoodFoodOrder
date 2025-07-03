import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterSearchForDelivererOrdersDto {
  @ApiProperty({
    example: 50.6357,
    description: 'Latitude du livreur',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @ApiProperty({
    example: 3.0601,
    description: 'Longitude du livreur',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  long?: number;

  @ApiProperty({
    example: 5000,
    description: 'Périmètre en mètres pour filtrer les commandes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100, { message: 'Le périmètre doit être d’au moins 100 mètres' })
  @Type(() => Number)
  perimeter?: number;

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