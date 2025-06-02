import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthValidationService } from '../auth-validation/auth-validation.service';
import { RoleAuthGuard } from '../auth-validation/role-auth.guard';

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(RoleAuthGuard('client'))
  @ApiOperation({ summary: 'Créer une nouvelle commande pour un client' })
  @ApiResponse({ status: 200, description: 'Commande créée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Échec de la vérification ou données invalides',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Vérification du client échouée' })
  async createOrder(@Request() req, @Body() body: CreateOrderDto) {
    
    const { id, role } = req.auth;

      // Vérifier que user_id correspond à l'id du token
      if (parseInt(id, 10) !== body.user_id) {
        throw new HttpException(
          "L'ID utilisateur ne correspond pas au token",
          HttpStatus.FORBIDDEN,
        );
      }
    try {
      // Vérifier le client
      await this.authValidationService.verifyUser(
        id,
        'client',
        req.headers['authorization']?.split(' ')[1],
      );
      const order = await this.orderService.create(body);
      return {
        order,
      };
    } catch (err) {
      throw new HttpException(
        err.message || 'Échec de la vérification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
