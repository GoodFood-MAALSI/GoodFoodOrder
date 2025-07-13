import { ApiProperty } from '@nestjs/swagger';

export class ClientDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Antoine' })
  first_name: string;

  @ApiProperty({ example: 'Griezmann' })
  last_name: string;

  @ApiProperty({ example: 'antoine.griezmann@goodfood-maalsi.com' })
  email: string;
}