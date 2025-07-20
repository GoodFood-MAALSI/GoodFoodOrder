import { ApiProperty } from '@nestjs/swagger';

export class DeliveryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  transport_mode_id: number;
}