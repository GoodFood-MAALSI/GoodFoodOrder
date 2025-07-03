import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

export enum OrderStatusContext {
  ALL = 'all',
  DELIVERER = 'deliverer',
}

export class FilterOrderStatusDto {
  @ApiPropertyOptional({
    description: 'Contexte pour filtrer les statuts de commande',
    enum: OrderStatusContext,
    example: OrderStatusContext.ALL,
  })
  @IsOptional()
  @IsEnum(OrderStatusContext, { message: 'Le contexte est invalide' })
  context?: OrderStatusContext;
}
