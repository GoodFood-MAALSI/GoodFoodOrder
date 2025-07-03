import { Module } from '@nestjs/common';
import { TypeOrmModule } from 'node_modules/@nestjs/typeorm';
import { OrderStatus } from './entities/order-status.entity';
import { OrderStatusService } from './order-status.service';
import { OrderStatusController } from './order-status.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderStatus])],
  controllers: [OrderStatusController],
  providers: [OrderStatusService],
})
export class OrderStatusModule {}
