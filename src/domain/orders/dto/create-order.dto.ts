import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 1, description: "ID de l'article de menu" })
  @IsNotEmpty()
  @IsInt()
  menu_item_id: number;

  @ApiProperty({ example: 2, description: 'Quantité commandée' })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'La quantité doit être au moins 1' })
  quantity: number;

  @ApiProperty({ example: 10.5, description: "Prix unitaire de l'article" })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  unit_price: number;

  @ApiProperty({
    example: [1, 2],
    description: 'IDs des options sélectionnées',
  })
  @IsArray()
  @IsInt({ each: true })
  selected_option_value_ids: number[];

  @ApiProperty({
    example: 'Sans oignons',
    description: "Notes pour l'article",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: 'ID du restaurant' })
  @IsNotEmpty()
  @IsInt()
  restaurant_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID du statut de la commande',
    default: 1,
  })
  @IsInt()
  status_id: number = 1;

  @ApiProperty({
    example: 'Livraison rapide souhaitée',
    description: 'Description de la commande',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 21.0, description: 'Sous-total de la commande' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  subtotal: number;

  @ApiProperty({ example: 4.5, description: 'Frais de livraison' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  delivery_costs: number;

  @ApiProperty({ example: 2.0, description: 'Frais de service' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  service_charge: number;

  @ApiProperty({ example: 5.0, description: 'Remise globale', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  global_discount?: number;

  @ApiProperty({ example: '45' })
  @IsString()
  @IsNotEmpty()
  street_number: string;

  @ApiProperty({ example: 'Avenue des Délices' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @ApiProperty({ example: 'France' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 16.0 })
  @IsNumber()
  long: number;

  @ApiProperty({ example: 16.0 })
  @IsNumber()
  lat: number;

  @ApiProperty({ type: [OrderItemDto], description: 'Articles de la commande' })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}