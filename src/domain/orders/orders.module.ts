import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-items.entity';
import { OrderStatus } from '../order-status/entities/order-status.entity';
import { OrderController } from './orders.controller';
import { OrderService } from './orders.service';
import { InterserviceService } from '../interservice/interservice.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { ConfigModule } from '@nestjs/config';
import { InterserviceAuthGuard } from '../interservice/guards/interservice-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatus]),
    HttpModule,
    ConfigModule
  ],
  controllers: [OrderController],
  providers: [OrderService, InterserviceService, KafkaConsumerService, InterserviceAuthGuard],
})
export class OrderModule {}