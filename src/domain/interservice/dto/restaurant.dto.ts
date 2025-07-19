import { ApiProperty } from '@nestjs/swagger';

export class ImageDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'restaurant-banner.jpg' })
  filename: string;

  @ApiProperty({ example: '/uploads/restaurants/restaurant-banner.jpg' })
  path: string;

  @ApiProperty({ example: true })
  isMain: boolean;
}

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

  @ApiProperty({ example: 16.0 })
  long: number;

  @ApiProperty({ example: 16.0 })
  lat: number;

  @ApiProperty({ type: [ImageDto], required: false })
  images?: ImageDto[];
}