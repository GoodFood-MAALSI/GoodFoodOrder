import { ApiProperty } from '@nestjs/swagger';

export class RestaurantDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'La Chicorée' })
  name: string;

  @ApiProperty({ example: '15' })
  street_number: string;

  @ApiProperty({ example: 'Place Rihour' })
  street: string;

  @ApiProperty({ example: 'Lille' })
  city: string;

  @ApiProperty({ example: '59800' })
  postal_code: string;

  @ApiProperty({ example: 'France' })
  country: string;

  @ApiProperty({ example: 'contact@lachicoree.fr' })
  email: string;

  @ApiProperty({ example: '33320543952' })
  phone_number: string;
}
