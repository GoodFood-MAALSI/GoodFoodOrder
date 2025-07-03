import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { OrderStatusService } from './order-status.service';
import { FilterOrderStatusDto } from './dto/filter-order-status.dto';

@Controller('order-status')
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des statuts de commandes' })
  findAll(@Query() filterDto: FilterOrderStatusDto) {
    return this.orderStatusService.findAll(filterDto);
  }
}
