import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: "ID de l'utilisateur" })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: 'ID du restaurant' })
  @IsNumber()
  restaurant_id: number;

  @ApiProperty({ description: 'ID du statut de la commande' })
  @IsNumber()
  statut_id: number = 1;

  @ApiProperty({ description: 'Description de la commande', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Sous-total', example: 49.99 })
  @IsNumber()
  subtotal: number;

  @ApiProperty({ description: 'Frais de livraison', example: 4.50 })
  @IsNumber()
  delivery_costs: number;

  @ApiProperty({ description: 'Frais de service', example: 2.00 })
  @IsNumber()
  service_charge: number;

  @ApiProperty({ description: 'Remise globale', example: 5.00 })
  @IsNumber()
  global_discount: number;
}
