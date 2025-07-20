import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStatus } from './entities/order-status.entity';
import { OrderStatusService } from './order-status.service';
import { OrderStatusController } from './order-status.controller';
import { InterserviceAuthGuard } from '../interservice/guards/interservice-auth.guard';
import { HttpModule } from 'node_modules/@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([OrderStatus]), HttpModule],
  controllers: [OrderStatusController],
  providers: [OrderStatusService, InterserviceAuthGuard],
})
export class OrderStatusModule {}
