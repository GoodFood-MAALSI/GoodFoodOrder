import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './orders.controller';
import { OrderService } from './orders.service';
import { Order } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), HttpModule],
  controllers: [OrderController],
  providers: [OrderService, 
    // AuthValidationService
  ],
})
export class OrderModule {}