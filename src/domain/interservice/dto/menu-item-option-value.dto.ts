import { ApiProperty } from "node_modules/@nestjs/swagger/dist";

export class MenuItemOptionValueDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Extra Fromage' })
  name: string;

  @ApiProperty({ example: '1.50' })
  extra_price: string;
}