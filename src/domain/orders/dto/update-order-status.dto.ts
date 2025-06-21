import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 2,
    description: 'ID du nouveau statut de la commande',
  })
  @IsNotEmpty()
  @IsInt()
  status_id: number;
}