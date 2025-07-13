import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-items.entity';
import { OrderStatus } from '../order-status/entities/order-status.entity';
import { OrderController } from './orders.controller';
import { OrderService } from './orders.service';
import { InterserviceService } from '../interservice/interservice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatus]),
    HttpModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, InterserviceService],
})
export class OrderModule {}