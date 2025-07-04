import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum Period {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class StatsOrderByRestaurantFilterDto {
  @ApiPropertyOptional({
    description: 'Période pour filtrer les statistiques',
    enum: Period,
    example: Period.TODAY,
  })
  @IsOptional()
  @IsEnum(Period)
  period?: Period;
}