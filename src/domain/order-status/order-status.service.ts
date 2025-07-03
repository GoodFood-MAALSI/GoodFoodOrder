import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderStatus } from './entities/order-status.entity';
import { FilterOrderStatusDto, OrderStatusContext } from './dto/filter-order-status.dto';

@Injectable()
export class OrderStatusService {
  constructor(
    @InjectRepository(OrderStatus)
    private readonly orderStatusRepository: Repository<OrderStatus>,
  ) {}

  async findAll(filterDto: FilterOrderStatusDto) {
    const { context } = filterDto;

    if (context === OrderStatusContext.ALL) {
      return this.orderStatusRepository.find();
    }

    if (context === OrderStatusContext.DELIVERER) {
      return this.orderStatusRepository.find({
        where: { id: In([3, 4, 5, 6, 7]), },
      });
    }

    return this.orderStatusRepository.find();
  }
}
