import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderStatusService } from './order-status.service';
import { FilterOrderStatusDto } from './dto/filter-order-status.dto';
import { InterserviceAuthGuardFactory } from '../interservice/guards/interservice-auth.guard';

@Controller('order-status')
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) {}

  @Get()
  @UseGuards(InterserviceAuthGuardFactory(['client', 'deliverer', 'super-admin', 'admin', 'restaurateur']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer la liste des statuts de commandes' })
  findAll(@Query() filterDto: FilterOrderStatusDto) {
    return this.orderStatusService.findAll(filterDto);
  }
}
