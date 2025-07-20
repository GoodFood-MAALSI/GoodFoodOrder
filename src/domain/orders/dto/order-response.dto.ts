import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../entities/order.entity';
import { Client } from '../../interservice/interfaces/client.interface';
import { Restaurant } from '../../interservice/interfaces/restaurant.interface';
import { Deliverer } from '../../interservice/interfaces/deliverer.interface';
import { OrderItem } from 'src/domain/order-items/entities/order-items.entity';
import { ClientDto } from 'src/domain/interservice/dto/client.dto';
import { RestaurantDto } from 'src/domain/interservice/dto/restaurant.dto';
import { DelivererDto } from 'src/domain/interservice/dto/deliverer.dto';
import { MenuItem } from 'src/domain/interservice/interfaces/menu-item.interface';
import { MenuItemDto } from 'src/domain/interservice/dto/menu-item.dto';
import { MenuItemOptionValueDto } from 'src/domain/interservice/dto/menu-item-option-value.dto';
import { MenuItemOptionValue } from 'src/domain/interservice/interfaces/menu-item-option-value.interface';
import { DeliveryDto } from 'src/domain/interservice/dto/delivery.dto';
import { Delivery } from 'src/domain/interservice/interfaces/delivery.interface';

export class OrderItemResponseDto extends OrderItem {
  @ApiProperty({ type: () => MenuItemDto, required: false })
  menu_item?: MenuItem;

  @ApiProperty({ type: () => MenuItemOptionValueDto, isArray: true, required: false })
  menu_item_option_values?: MenuItemOptionValue[];
}

export class OrderResponseDto extends Order {
  @ApiProperty({ type: () => ClientDto, required: false })
  client?: Client;

  @ApiProperty({ type: () => RestaurantDto, required: false })
  restaurant?: Restaurant;

  @ApiProperty({ type: () => DelivererDto, required: false })
  deliverer?: Deliverer;

  @ApiProperty({ type: () => OrderItemResponseDto, isArray: true })
  orderItems?: OrderItemResponseDto[];

  @ApiProperty({ type: () => DeliveryDto, required: false })
  delivery?: Delivery;
}