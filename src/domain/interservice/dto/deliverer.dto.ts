import { ApiProperty } from '@nestjs/swagger';

export class DelivererDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Jean' })
  first_name: string;

  @ApiProperty({ example: 'Dupont' })
  last_name: string;

  @ApiProperty({ example: 'jean.dupont@goodfood-maalsi.com' })
  email: string;
}