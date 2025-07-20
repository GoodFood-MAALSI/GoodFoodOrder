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
  UseGuards,
  Req,
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
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Order } from './entities/order.entity';
import { BypassResponseWrapper } from '../utils/decorators/bypass-response-wrapper.decorator';
import { InterserviceAuthGuardFactory } from '../interservice/guards/interservice-auth.guard';
import { Request } from 'express';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(InterserviceAuthGuardFactory(['client']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle commande' })
  @ApiResponse({
    status: 201,
    description: 'Commande créée avec succès.',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Données de requête invalides.' })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.create(createOrderDto, userId);
  }

  @Post('accept')
  @UseGuards(InterserviceAuthGuardFactory(['deliverer']))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accepter une commande et assigner un livreur' })
  @ApiResponse({
    status: 200,
    description: 'Commande acceptée et livreur assigné.',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Données de requête invalides.' })
  @ApiResponse({ status: 404, description: 'Commande ou statut non trouvé.' })
  async acceptOrder(@Body() body: { orderId: number; delivererId: number }, @Req() req: Request) {
    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.acceptOrder(body.orderId, body.delivererId, userId);
  }

  @Get()
  @UseGuards(InterserviceAuthGuardFactory(['super-admin', 'admin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer toutes les commandes' })
  @ApiResponse({ status: 200, description: 'Liste des commandes.' })
  async findAll(@Query() filters: FilterOrdersDto) {
    return this.orderService.findAll(filters);
  }

  @Get('delivery')
  @UseGuards(InterserviceAuthGuardFactory(['deliverer']))
  @ApiBearerAuth()
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
  @UseGuards(InterserviceAuthGuardFactory(['client', 'deliverer', 'super-admin', 'admin', 'restaurateur']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer une commande par ID' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la commande.',
    type: Order,
  })
  @ApiResponse({ status: 404, description: 'Commande non trouvée.' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new HttpException('ID invalide', HttpStatus.BAD_REQUEST);
    }

    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.findOne(orderId, { id: userId, role: user.role });
  }

  @Get('client/:clientId')
  @UseGuards(InterserviceAuthGuardFactory(['client']))
  @ApiBearerAuth()
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
    @Param('clientId') clientId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ) {
    const clientIdNum = parseInt(clientId);
    if (isNaN(clientIdNum)) {
      throw new HttpException('clientId invalide', HttpStatus.BAD_REQUEST);
    }

    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.findByClient(clientIdNum, page, limit, { id: userId, role: user.role });
  }

  @Get('restaurant/:restaurantId')
  @UseGuards(InterserviceAuthGuardFactory(['restaurateur']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les commandes d’un restaurant' })
  @ApiResponse({
    status: 200,
    description: 'Liste des commandes du restaurant.',
  })
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query() filters: FilterRestaurantOrdersDto,
    @Req() req: Request,
  ) {
    const restaurantIdNum = parseInt(restaurantId);
    if (isNaN(restaurantIdNum)) {
      throw new HttpException('restaurantId invalide', HttpStatus.BAD_REQUEST);
    }

    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.findByRestaurant(restaurantIdNum, filters, { id: userId, role: user.role });
  }

  @Get('deliverer/:delivererId')
  @UseGuards(InterserviceAuthGuardFactory(['deliverer']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les commandes d’un livreur' })
  @ApiResponse({ status: 200, description: 'Liste des commandes du livreur.' })
  async findByDeliverer(
    @Param('delivererId') delivererId: string,
    @Query() filters: FilterDelivererOrdersDto,
    @Req() req: Request,
  ) {
    const delivererIdNum = parseInt(delivererId);
    if (isNaN(delivererIdNum)) {
      throw new HttpException('delivererId invalide', HttpStatus.BAD_REQUEST);
    }

    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.findByDeliverer(delivererIdNum, filters, { id: userId, role: user.role });
  }

  @Post(':id/status')
  @UseGuards(InterserviceAuthGuardFactory(['deliverer', 'super-admin', 'admin', 'restaurateur']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le statut d’une commande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour.', type: Order })
  @ApiResponse({ status: 404, description: 'Commande ou statut non trouvé.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new HttpException('ID invalide', HttpStatus.BAD_REQUEST);
    }

    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.updateStatus(orderId, updateOrderStatusDto, { id: userId, role: user.role });
  }

  @Post(':id/cancel')
  @UseGuards(InterserviceAuthGuardFactory(['deliverer', 'super-admin', 'admin', 'restaurateur']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Annuler une commande' })
  @ApiResponse({ status: 200, description: 'Commande annulée.', type: Order })
  @ApiResponse({ status: 400, description: 'Commande déjà annulée.' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée.' })
  async cancelOrder(@Param('id') id: string, @Req() req: Request) {
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new HttpException('ID invalide', HttpStatus.BAD_REQUEST);
    }

    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.cancelOrder(orderId, { id: userId, role: user.role });
  }

  @Get('restaurant/:restaurantId/stats')
  @UseGuards(InterserviceAuthGuardFactory(['restaurateur']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques d’un restaurant' })
  @ApiResponse({ status: 200, description: 'Statistiques du restaurant.' })
  async getRestaurantStats(
    @Param('restaurantId') restaurantId: string,
    @Query() filters: StatsOrderByRestaurantFilterDto,
    @Req() req: Request,
  ) {
    const restaurantIdNum = parseInt(restaurantId);
    if (isNaN(restaurantIdNum)) {
      throw new HttpException('restaurantId invalide', HttpStatus.BAD_REQUEST);
    }

    const user = req.user;
    if (!user || !user.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    return this.orderService.getRestaurantStats(restaurantIdNum, filters, { id: userId, role: user.role });
  }

  @Get('interservice/:id')
  @ApiExcludeEndpoint()
  @BypassResponseWrapper()
  @ApiOperation({ summary: 'Récupérer une commande pour appels interservices' })
  @ApiParam({ name: 'id', description: 'ID de la commande', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Commande récupérée avec succès',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'ID invalide' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async getOrderForInterservice(@Param('id') id: string) {
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new HttpException('ID doit être un nombre', HttpStatus.BAD_REQUEST);
    }

    const order = await this.orderService.findOneOnlyOrder(orderId);
    if (!order) {
      throw new HttpException('Commande non trouvée', HttpStatus.NOT_FOUND);
    }

    return {
      id: order.id,
      status_id: order.status_id,
      subtotal: order.subtotal,
    };
  }
}