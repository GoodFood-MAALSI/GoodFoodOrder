import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterDelivererOrdersDto {
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
}