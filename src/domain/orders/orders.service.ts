import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-items.entity';
import { OrderStatus } from '../order-status/entities/order-status.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterSearchForDelivererOrdersDto } from './dto/filter-search-for-deliverer-orders.dto';
import { FilterRestaurantOrdersDto } from './dto/filter-restaurant-orders.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { FilterDelivererOrdersDto } from './dto/filter-deliverer-orders.dto';
import { StatsOrderByRestaurantFilterDto } from './dto/stats-order-by-restaurant.dto';
import * as geolib from 'geolib';
import { Client } from '../interservice/interfaces/client.interface';
import { Restaurant } from '../interservice/interfaces/restaurant.interface';
import { Deliverer } from '../interservice/interfaces/deliverer.interface';
import { MenuItem } from '../interservice/interfaces/menu-item.interface';
import { MenuItemOptionValue } from '../interservice/interfaces/menu-item-option-value.interface';
import { InterserviceService } from '../interservice/interservice.service';
import { Delivery } from '../interservice/interfaces/delivery.interface';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatus)
    private readonly orderStatusRepository: Repository<OrderStatus>,
    private readonly interserviceService: InterserviceService,
  ) {}

  private async enrichOrder(
    order: Order,
  ): Promise<
    Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
      delivery?: Delivery;
    }
  > {
    const client = await this.interserviceService.fetchClient(order.client_id);
    const restaurant = await this.interserviceService.fetchRestaurant(order.restaurant_id);
    const deliverer = order.deliverer_id
      ? await this.interserviceService.fetchDeliverer(order.deliverer_id)
      : null;

    const enrichedOrderItems = order.orderItems
      ? await Promise.all(
          order.orderItems.map(async (item) => {
            const menu_item = await this.interserviceService.fetchMenuItem(item.menu_item_id);
            const menu_item_option_values = item.selected_option_value_ids.length
              ? await this.interserviceService.fetchMenuItemOptionValues(item.selected_option_value_ids)
              : [];
            return { ...item, menu_item, menu_item_option_values };
          }),
        )
      : undefined;

    const delivery = await this.interserviceService.fetchDeliveryByOrderId(order.id);

    return {
      ...order,
      client,
      restaurant,
      deliverer,
      orderItems: enrichedOrderItems,
      delivery,
    };
  }

  private async enrichOrders(
    orders: Order[],
  ): Promise<
    (Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    })[]
  > {
    return Promise.all(
      orders.map((order) => this.enrichOrder(order)),
    );
  }

  async create(createOrderDto: CreateOrderDto): Promise<
    Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    }
  > {
    const {
      client_id,
      restaurant_id,
      status_id,
      description,
      subtotal,
      delivery_costs,
      service_charge,
      global_discount,
      street_number,
      street,
      city,
      postal_code,
      country,
      long,
      lat,
      items,
    } = createOrderDto;

    const status = await this.orderStatusRepository.findOne({
      where: { id: status_id },
    });
    if (!status) {
      throw new NotFoundException(`Statut de commande ${status_id} introuvable`);
    }

    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
      throw new BadRequestException('Le sous-total fourni ne correspond pas aux articles');
    }

    try {
      const order = this.orderRepository.create({
        client_id,
        restaurant_id,
        status_id,
        description,
        subtotal,
        delivery_costs,
        service_charge,
        global_discount: global_discount || 0,
        street_number,
        street,
        city,
        postal_code,
        country,
        long,
        lat,
      });

      const savedOrder = await this.orderRepository.save(order);

      const orderItems = items.map((item) =>
        this.orderItemRepository.create({
          order_id: savedOrder.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes,
          selected_option_value_ids: item.selected_option_value_ids,
        }),
      );

      savedOrder.orderItems = await this.orderItemRepository.save(orderItems);

      return savedOrder;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la sauvegarde de la commande: ${error.message}`,
      );
    }
  }

  async acceptOrder(orderId: number, delivererId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId }
    });
    if (!order) {
      throw new NotFoundException(`Commande ${orderId} introuvable`);
    }

    if (order.status_id !== 2) {
      throw new BadRequestException('La commande doit être au statut 2 pour être acceptée');
    }

    const status = await this.orderStatusRepository.findOne({
      where: { id: 3 },
    });
    if (!status) {
      throw new NotFoundException('Statut 3 introuvable');
    }

    order.status_id = 3;
    order.status = status;
    order.deliverer_id = delivererId;

    const updatedOrder = await this.orderRepository.save(order);

    return updatedOrder;
  }

  async findAll(
    filters: FilterOrdersDto,
  ): Promise<{
    orders: (Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    })[];
    total: number;
  }> {
    const { page = 1, limit = 10, status_id } = filters;

    const where: any = {};
    if (status_id) {
      where.status_id = status_id;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['status'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enrichedOrders = await this.enrichOrders(orders);
    return { orders: enrichedOrders, total };
  }

  async findOne(id: number): Promise<
    Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
      delivery?: Delivery;
    }
  > {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['status', 'orderItems'],
    });
    if (!order) {
      throw new NotFoundException(`Commande ${id} introuvable`);
    }
    return this.enrichOrder(order);
  }

  async findByClient(
    clientId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    orders: (Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    })[];
    total: number;
  }> {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { client_id: clientId },
      relations: ['status'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enrichedOrders = await this.enrichOrders(orders);
    return { orders: enrichedOrders, total };
  }

  async findByRestaurant(
    restaurantId: number,
    filters: FilterRestaurantOrdersDto = {},
  ): Promise<{
    orders: (Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    })[];
    total: number;
  }> {
    const { page = 1, limit = 10, status_id } = filters;

    const where: any = { restaurant_id: restaurantId };
    if (status_id) {
      where.status_id = status_id;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['status'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enrichedOrders = await this.enrichOrders(orders);
    return { orders: enrichedOrders, total };
  }

  async findForDelivery(
    filters: FilterSearchForDelivererOrdersDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    orders: (Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    })[];
    total: number;
  }> {
    const [allOrders] = await this.orderRepository.findAndCount({
      where: {
        deliverer_id: IsNull(),
        status_id: 2,
      },
      relations: ['status'],
      order: { created_at: 'DESC' },
    });

    let filteredOrders = allOrders;
    if (filters.lat && filters.long && filters.perimeter) {
      const center = { latitude: filters.lat, longitude: filters.long };
      filteredOrders = allOrders.filter((order) => {
        if (order.lat == null || order.long == null) return false;

        const distance = geolib.getDistance(center, {
          latitude: order.lat,
          longitude: order.long,
        });

        return distance <= filters.perimeter;
      });
    }

    const offset = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);
    const total = filteredOrders.length;

    const enrichedOrders = await this.enrichOrders(paginatedOrders);
    return { orders: enrichedOrders, total };
  }

  async findByDeliverer(
    delivererId: number,
    filters: FilterDelivererOrdersDto,
  ): Promise<{
    orders: (Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    })[];
    total: number;
  }> {
    const { page = 1, limit = 10, status_id } = filters;

    const where: any = { deliverer_id: delivererId };
    if (status_id) {
      where.status_id = status_id;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['status'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enrichedOrders = await this.enrichOrders(orders);
    return { orders: enrichedOrders, total };
  }

  async updateStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<
    Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    }
  > {
    const order = await this.orderRepository.findOne({
      where: { id }
    });
    if (!order) {
      throw new NotFoundException(`Commande ${id} introuvable`);
    }

    const status = await this.orderStatusRepository.findOne({
      where: { id: updateOrderStatusDto.status_id },
    });
    if (!status) {
      throw new NotFoundException(
        `Statut de commande ${updateOrderStatusDto.status_id} introuvable`,
      );
    }

    order.status_id = updateOrderStatusDto.status_id;
    order.status = status;

    await this.orderRepository.save(order);

    const reloadedOrder = await this.orderRepository.findOne({
      where: { id },
    });

    return reloadedOrder;
  }

  async updateStatusAndDeliverer(
    id: number,
    updateOrderStatusDto: { status_id: number; deliverer_id: number },
  ): Promise<
    Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    }
  > {
    const order = await this.orderRepository.findOne({
      where: { id }
    });
    if (!order) {
      throw new NotFoundException(`Commande ${id} introuvable`);
    }

    const status = await this.orderStatusRepository.findOne({
      where: { id: updateOrderStatusDto.status_id },
    });
    if (!status) {
      throw new NotFoundException(
        `Statut de commande ${updateOrderStatusDto.status_id} introuvable`,
      );
    }

    order.status_id = updateOrderStatusDto.status_id;
    order.status = status;
    order.deliverer_id = updateOrderStatusDto.deliverer_id;

    await this.orderRepository.save(order);

    const reloadedOrder = await this.orderRepository.findOne({
      where: { id }
    });

    return reloadedOrder;
  }

  async cancelOrder(id: number): Promise<
    Order & {
      client?: Client;
      restaurant?: Restaurant;
      deliverer?: Deliverer;
      orderItems?: (OrderItem & {
        menu_item?: MenuItem;
        menu_item_option_values?: MenuItemOptionValue[];
      })[];
    }
  > {
    const order = await this.orderRepository.findOne({
      where: { id }
    });
    if (!order) {
      throw new NotFoundException(`Commande ${id} introuvable`);
    }

    if (order.status_id === 7) {
      throw new BadRequestException('La commande est déjà annulée');
    }

    const status = await this.orderStatusRepository.findOne({
      where: { id: 7 },
    });
    if (!status) {
      throw new NotFoundException('Statut annulé introuvable');
    }

    order.status_id = 7;
    order.status = status;

    await this.orderRepository.save(order);

    const reloadedOrder = await this.orderRepository.findOne({
      where: { id }
    });

    return reloadedOrder;
  }

  async getRestaurantStats(
    restaurantId: number,
    filters: StatsOrderByRestaurantFilterDto,
  ): Promise<{
    order_count: number;
    menu_item_id: number | null;
    menu_item?: MenuItem | null;
    item_count: number | null;
    revenue: number;
  }> {
    const { period } = filters;
    const where: any = { restaurant_id: restaurantId };

    const today = new Date();
    if (period) {
      switch (period) {
        case 'today':
          where.created_at = MoreThanOrEqual(
            new Date(today.setHours(0, 0, 0, 0)),
          );
          break;
        case 'week':
          const weekStart = new Date(
            today.setDate(today.getDate() - today.getDay()),
          );
          weekStart.setHours(0, 0, 0, 0);
          where.created_at = MoreThanOrEqual(weekStart);
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          where.created_at = MoreThanOrEqual(monthStart);
          break;
        case 'year':
          const yearStart = new Date(today.getFullYear(), 0, 1);
          where.created_at = MoreThanOrEqual(yearStart);
          break;
        default:
          throw new BadRequestException('Période invalide');
      }
    }

    const order_count = await this.orderRepository.count({ where });

    const mostOrderedMenuItem = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('orderItem.menu_item_id', 'menu_item_id')
      .addSelect('SUM(orderItem.quantity)', 'item_count')
      .leftJoin('orderItem.order', 'order')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere(
        where.created_at ? 'order.created_at >= :created_at' : '1=1',
        {
          created_at: where.created_at?.value,
        },
      )
      .groupBy('orderItem.menu_item_id')
      .orderBy('SUM(orderItem.quantity)', 'DESC')
      .limit(1)
      .getRawOne();

    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select(
        'SUM(order.subtotal - COALESCE(order.global_discount, 0))',
        'revenue',
      )
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere(
        where.created_at ? 'order.created_at >= :created_at' : '1=1',
        {
          created_at: where.created_at?.value,
        },
      )
      .getRawOne();

    const menu_item = mostOrderedMenuItem
      ? await this.interserviceService.fetchMenuItem(mostOrderedMenuItem.menu_item_id)
      : null;

    return {
      order_count,
      menu_item_id: mostOrderedMenuItem
        ? mostOrderedMenuItem.menu_item_id
        : null,
      menu_item,
      item_count: mostOrderedMenuItem
        ? parseInt(mostOrderedMenuItem.item_count)
        : null,
      revenue: revenueResult ? parseFloat(revenueResult.revenue) || 0 : 0,
    };
  }

  async findOneOnlyOrder(id: number): Promise<Order | null> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('ID invalide');
    }

    const order = await this.orderRepository.findOne({
    where: { id },
    select: ['id', 'status_id'],
  });

    return order;
  }

}