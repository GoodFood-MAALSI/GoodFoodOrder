import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpException,
  HttpStatus,
  BadRequestException,
  Query,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterDelivererOrdersDto } from './dto/filter-deliverer-orders.dto';
import { FilterRestaurantOrdersDto } from './dto/filter-restaurant-orders.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import {
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrderService } from './orders.service';
import { Pagination } from '../utils/pagination';

@Controller('orders')
@ApiTags('Orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les commandes' })
  @ApiQuery({
    name: 'status_id',
    required: false,
    type: Number,
    description: 'ID du statut pour filtrer les commandes',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre maximum d’items par page',
    example: 10,
  })
  async findAll(
    @Query() filters: FilterOrdersDto,
    @Req() req: Request,
  ) {
    try {
      const { page = 1, limit = 10 } = filters;

      const { orders, total } = await this.orderService.findAll(
        filters,
        page,
        limit,
      );

      const { links, meta } = Pagination.generatePaginationMetadata(
        req,
        page,
        total,
        limit,
      );

      return { orders, links, meta };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Échec de la récupération des commandes',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('delivery')
  @ApiOperation({
    summary: 'Récupérer les commandes en attente pour un livreur',
  })
  async findForDelivery(
    @Query() filters: FilterDelivererOrdersDto,
    @Req() req: Request,
  ) {
    try {
      const { page = 1, limit = 10 } = filters;

      const { orders, total } = await this.orderService.findForDelivery(
        filters,
        page,
        limit,
      );

      const { links, meta } = Pagination.generatePaginationMetadata(
        req,
        page,
        total,
        limit,
      );

      return { orders, links, meta };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Échec de la récupération des commandes pour livraison',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer une commande' })
  @ApiBody({ type: CreateOrderDto })
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      return await this.orderService.create(createOrderDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Échec de la création de la commande',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une commande spécifique par ID' })
  @ApiParam({ name: 'id', description: 'ID de la commande', type: Number })
  async findOne(@Param('id') id: string) {
    try {
      const idNum = parseInt(id);
      if (isNaN(idNum)) {
        throw new BadRequestException('id doit être un nombre');
      }
      return await this.orderService.findOne(idNum);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Commande introuvable',
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Échec de la récupération de la commande',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Récupérer les commandes d’un client' })
  @ApiParam({ name: 'clientId', description: 'ID du client', type: Number })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre maximum d’items par page',
    example: 10,
  })
  async findByClient(
    @Param('clientId') clientId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ) {
    try {
      const clientIdNum = parseInt(clientId);
      if (isNaN(clientIdNum)) {
        throw new BadRequestException('clientId doit être un nombre');
      }
      const { orders, total } = await this.orderService.findByClient(
        clientIdNum,
        page,
        limit,
      );
      const { links, meta } = Pagination.generatePaginationMetadata(
        req,
        page,
        total,
        limit,
      );
      return { orders, links, meta };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Échec de la récupération des commandes',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Récupérer les commandes d’un restaurant' })
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query() filters: FilterRestaurantOrdersDto,
    @Req() req: Request,
  ) {
    try {
      const restaurantIdNum = parseInt(restaurantId);
      if (isNaN(restaurantIdNum)) {
        throw new BadRequestException('restaurantId doit être un nombre');
      }

      const { page = 1, limit = 10 } = filters;

      const { orders, total } = await this.orderService.findByRestaurant(
        restaurantIdNum,
        page,
        limit,
        filters,
      );

      const { links, meta } = Pagination.generatePaginationMetadata(
        req,
        page,
        total,
        limit,
      );
      return { orders, links, meta };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Échec de la récupération des commandes',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d’une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande', type: Number })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    try {
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        throw new BadRequestException(
          "L'ID de la commande doit être un nombre",
        );
      }

      return await this.orderService.updateStatus(idNum, updateOrderStatusDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Commande ou statut introuvable',
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Échec de la mise à jour du statut de la commande',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}