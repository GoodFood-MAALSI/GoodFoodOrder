import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
  HttpException,
} from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { FilterRestaurantOrdersDto } from './dto/filter-restaurant-orders.dto';
import { FilterSearchForDelivererOrdersDto } from './dto/filter-search-for-deliverer-orders.dto';
import { FilterDelivererOrdersDto } from './dto/filter-deliverer-orders.dto';
import { StatsOrderByRestaurantFilterDto } from './dto/stats-order-by-restaurant.dto';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Order } from './entities/order.entity';
import { BypassResponseWrapper } from '../utils/decorators/bypass-response-wrapper.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle commande' })
  @ApiResponse({
    status: 201,
    description: 'Commande créée avec succès.',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Données de requête invalides.' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accepter une commande et assigner un livreur' })
  @ApiResponse({
    status: 200,
    description: 'Commande acceptée et livreur assigné.',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Données de requête invalides.' })
  @ApiResponse({ status: 404, description: 'Commande ou statut non trouvé.' })
  async acceptOrder(@Body() body: { orderId: number; delivererId: number }) {
    return this.orderService.acceptOrder(body.orderId, body.delivererId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les commandes' })
  @ApiResponse({ status: 200, description: 'Liste des commandes.' })
  async findAll(@Query() filters: FilterOrdersDto) {
    return this.orderService.findAll(filters);
  }

  @Get('delivery')
  @ApiOperation({
    summary: 'Récupérer les commandes disponibles pour livraison',
  })
  @ApiResponse({ status: 200, description: 'Liste des commandes disponibles.' })
  async findForDelivery(
    @Query() filters: FilterSearchForDelivererOrdersDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.orderService.findForDelivery(filters, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une commande par ID' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la commande.',
    type: Order,
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée.' })
  async findOne(@Param('id') id: number) {
    return this.orderService.findOne(id);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Récupérer les commandes d’un client' })
  @ApiResponse({ status: 200, description: 'Liste des commandes du client.' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page des résultats',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de résultats par page',
  })
  async findByClient(
    @Param('clientId') clientId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findByClient(clientId, page ?? 1, limit ?? 10);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Récupérer les commandes d’un restaurant' })
  @ApiResponse({
    status: 200,
    description: 'Liste des commandes du restaurant.',
  })
  async findByRestaurant(
    @Param('restaurantId') restaurantId: number,
    @Query() filters: FilterRestaurantOrdersDto,
  ) {
    return this.orderService.findByRestaurant(+restaurantId, filters);
  }

  @Get('deliverer/:delivererId')
  @ApiOperation({ summary: 'Récupérer les commandes d’un livreur' })
  @ApiResponse({ status: 200, description: 'Liste des commandes du livreur.' })
  async findByDeliverer(
    @Param('delivererId') delivererId: number,
    @Query() filters: FilterDelivererOrdersDto,
  ) {
    return this.orderService.findByDeliverer(delivererId, filters);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d’une commande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour.', type: Order })
  @ApiResponse({ status: 404, description: 'Commande ou statut non trouvé.' })
  async updateStatus(
    @Param('id') id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler une commande' })
  @ApiResponse({ status: 200, description: 'Commande annulée.', type: Order })
  @ApiResponse({ status: 400, description: 'Commande déjà annulée.' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée.' })
  async cancelOrder(@Param('id') id: number) {
    return this.orderService.cancelOrder(id);
  }

  @Get('restaurant/:restaurantId/stats')
  @ApiOperation({ summary: 'Récupérer les statistiques d’un restaurant' })
  @ApiResponse({ status: 200, description: 'Statistiques du restaurant.' })
  async getRestaurantStats(
    @Param('restaurantId') restaurantId: number,
    @Query() filters: StatsOrderByRestaurantFilterDto,
  ) {
    return this.orderService.getRestaurantStats(restaurantId, filters);
  }

  @Get('interservice/:id')
  @ApiExcludeEndpoint()
  @BypassResponseWrapper()
  @ApiOperation({ summary: 'Récupérer une commande pour appels interservices' })
  @ApiParam({ name: 'id', description: 'ID de la commande', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Commande récupéré avec succès',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'ID invalide' })
  @ApiResponse({ status: 404, description: 'Order non trouvé' })
  async getOrderForInterservice(
    @Param('id') id: string,
  ): Promise<Partial<Order>> {
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new HttpException('ID doit être un nombre', HttpStatus.BAD_REQUEST);
    }

    const order = await this.orderService.findOneOnlyOrder(orderId);
    if (!order) {
      throw new HttpException('Order non trouvé', HttpStatus.NOT_FOUND);
    }

    return {
      id: order.id,
      status_id: order.status_id,
    };
  }
}
