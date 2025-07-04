import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-items.entity';
import { OrderStatus } from '../order-status/entities/order-status.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterSearchForDelivererOrdersDto } from './dto/filter-search-for-deliverer-orders.dto';
import { FilterRestaurantOrdersDto } from './dto/filter-restaurant-orders.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import * as geolib from 'geolib';
import { FilterDelivererOrdersDto } from './dto/filter-deliverer-orders.dto';
import { StatsOrderByRestaurantFilterDto } from './dto/stats-order-by-restaurant.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatus)
    private readonly orderStatusRepository: Repository<OrderStatus>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
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

    // Vérifier que le statut existe
    const status = await this.orderStatusRepository.findOne({
      where: { id: status_id },
    });
    if (!status) {
      throw new NotFoundException(
        `Statut de commande ${status_id} introuvable`,
      );
    }

    // Vérifier que le subtotal correspond aux articles
    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
      throw new BadRequestException(
        'Le sous-total fourni ne correspond pas aux articles',
      );
    }

    try {
      // Créer la commande avec tous les champs, y compris l'adresse
      const order = this.orderRepository.create({
        client_id,
        restaurant_id,
        status_id: status_id,
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

      // Sauvegarder la commande pour obtenir un ID
      const savedOrder = await this.orderRepository.save(order);

      // Créer et associer les OrderItems
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

      // Sauvegarder les OrderItems
      savedOrder.orderItems = await this.orderItemRepository.save(orderItems);

      return savedOrder;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la sauvegarde de la commande: ${error.message}`,
      );
    }
  }

  async findAll(
    filters: FilterOrdersDto,
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      const { page = 1, limit = 10, status_id } = filters;

      const where: any = {};
      if (status_id) {
        where.status_id = status_id;
      }

      const [orders, total] = await this.orderRepository.findAndCount({
        where,
        relations: ['orderItems', 'status'],
        order: { created_at: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return { orders, total };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des commandes: ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['orderItems', 'status'],
      });
      if (!order) {
        throw new NotFoundException(`Commande ${id} introuvable`);
      }
      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la récupération de la commande: ${error.message}`,
      );
    }
  }

  async findByClient(
    clientId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      const [orders, total] = await this.orderRepository.findAndCount({
        where: { client_id: clientId },
        relations: ['orderItems', 'status'],
        order: { created_at: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return { orders, total };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des commandes: ${error.message}`,
      );
    }
  }

  async findByRestaurant(
    restaurantId: number,
    filters: FilterRestaurantOrdersDto = {},
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      const { page = 1, limit = 10, status_id } = filters;

      const where: any = { restaurant_id: restaurantId };
      if (status_id) {
        where.status_id = status_id;
      }

      const [orders, total] = await this.orderRepository.findAndCount({
        where,
        relations: ['orderItems', 'status'],
        order: { created_at: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return { orders, total };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des commandes: ${error.message}`,
      );
    }
  }

  async findForDelivery(
    filters: FilterSearchForDelivererOrdersDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      // Fetch orders with status_id = 2 (En attente de prise en charge par un livreur)
      const [allOrders] = await this.orderRepository.findAndCount({
        where: {
          deliverer_id: IsNull(),
          status_id: 2,
        },
        relations: ['orderItems', 'status'],
        order: { created_at: 'DESC' },
      });

      // Apply geolocation filter if lat, long, and perimeter are provided
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

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedOrders = filteredOrders.slice(offset, offset + limit);
      const total = filteredOrders.length;

      return { orders: paginatedOrders, total };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des commandes pour livraison: ${error.message}`,
      );
    }
  }

  async findByDeliverer(
    delivererId: number,
    filters: FilterDelivererOrdersDto,
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      const { page = 1, limit = 10, status_id } = filters;

      const where: any = { deliverer_id: delivererId };
      if (status_id) {
        where.status_id = status_id;
      }

      const [orders, total] = await this.orderRepository.findAndCount({
        where,
        relations: ['orderItems', 'status'],
        order: { created_at: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return { orders, total };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des commandes: ${error.message}`,
      );
    }
  }

  async updateStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['orderItems', 'status'],
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

      // Mettre à jour à la fois status_id et la relation status
      order.status_id = updateOrderStatusDto.status_id;
      order.status = status;

      await this.orderRepository.save(order);

      const reloadedOrder = await this.orderRepository.findOne({
        where: { id },
        relations: ['orderItems', 'status'],
      });

      return reloadedOrder;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de la mise à jour du statut de la commande : ${error.message}`,
      );
    }
  }

  async cancelOrder(id: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['orderItems', 'status'],
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
        where: { id },
        relations: ['orderItems', 'status'],
      });

      return reloadedOrder;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Erreur lors de l'annulation de la commande : ${error.message}`,
      );
    }
  }

  async getRestaurantStats(
    restaurantId: number,
    filters: StatsOrderByRestaurantFilterDto,
  ): Promise<{
    order_count: number;
    menu_item_id: number | null;
    item_count: number | null;
    revenue: number;
  }> {
    try {
      const { period } = filters;
      const where: any = { restaurant_id: restaurantId };

      // Définir la période de filtrage
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
            const monthStart = new Date(
              today.getFullYear(),
              today.getMonth(),
              1,
            );
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

      // Nombre total de commandes
      const order_count = await this.orderRepository.count({ where });

      // Article le plus commandé
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

      // CA (somme de subtotal - global_discount)
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

      return {
        order_count,
        menu_item_id: mostOrderedMenuItem
          ? mostOrderedMenuItem.menu_item_id
          : null,
        item_count: mostOrderedMenuItem
          ? parseInt(mostOrderedMenuItem.item_count)
          : null,
        revenue: revenueResult ? parseFloat(revenueResult.revenue) || 0 : 0,
      };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
    }
  }
}
