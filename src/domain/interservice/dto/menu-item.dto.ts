import { ApiProperty } from "node_modules/@nestjs/swagger/dist";

export class MenuItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Burger Classique' })
  name: string;

  @ApiProperty({ example: 'Un burger savoureux avec du bœuf, laitue, tomate et sauce spéciale.' })
  description: string;

  @ApiProperty({ example: '12.00' })
  price: string;
}
