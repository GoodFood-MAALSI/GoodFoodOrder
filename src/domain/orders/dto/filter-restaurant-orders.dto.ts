import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterRestaurantOrdersDto {
  @ApiProperty({
    description: 'ID du statut pour filtrer les commandes',
    required: false,
    type: Number,
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  status_id?: number;
}