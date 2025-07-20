import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { Client } from './interfaces/client.interface';
import { Restaurant } from './interfaces/restaurant.interface';
import { Deliverer } from './interfaces/deliverer.interface';
import { MenuItem } from './interfaces/menu-item.interface';
import { MenuItemOptionValue } from './interfaces/menu-item-option-value.interface';
import { Delivery } from './interfaces/delivery.interface';

@Injectable()
export class InterserviceService {
  constructor(private readonly httpService: HttpService) {}

  private readonly clientServiceUrl = process.env.CLIENT_SERVICE_URL;
  private readonly restaurantServiceUrl = process.env.RESTAURANT_SERVICE_URL;
  private readonly deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL;
  private readonly menuItemOptionValueUrl = process.env.MENU_ITEM_OPTION_VALUE_URL;
  private readonly clientJwtSecret = process.env.CLIENT_SECRET;
  private readonly restaurateurJwtSecret = process.env.RESTAURATEUR_SECRET;
  private readonly deliveryJwtSecret = process.env.DELIVERY_SECRET;
  private readonly jwtExpiresIn = '1h';

  private generateJwtTokenForClient(): string {
    return jwt.sign(
      { role: 'interservice', service: 'client' },
      this.clientJwtSecret,
      {
        expiresIn: this.jwtExpiresIn,
      },
    );
  }

  private generateJwtTokenForRestaurateur(): string {
    return jwt.sign(
      { role: 'interservice', service: 'restaurateur' },
      this.restaurateurJwtSecret,
      {
        expiresIn: this.jwtExpiresIn,
      },
    );
  }

  private generateJwtTokenForDelivery(): string {
    return jwt.sign(
      { role: 'interservice', service: 'delivery' },
      this.deliveryJwtSecret,
      {
        expiresIn: this.jwtExpiresIn,
      },
    );
  }

  async fetchClient(clientId: number): Promise<Client | null> {
    try {
      const route = `users/interservice/${clientId}`;
      const token = this.generateJwtTokenForClient();
      console.log(`Fetching client ${clientId} with token: ${token}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.clientServiceUrl}/${route}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      console.log(`Client ${clientId} fetched successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du client ${clientId}:`,
        error.response?.status,
        error.response?.data,
        error.message,
      );
      return null;
    }
  }

  async fetchRestaurant(restaurantId: number): Promise<Restaurant | null> {
    try {
      const route = `restaurant/interservice/${restaurantId}`;
      const token = this.generateJwtTokenForRestaurateur();
      console.log(`Fetching restaurant ${restaurantId} with token: ${token}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.restaurantServiceUrl}/${route}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      console.log(
        `Restaurant ${restaurantId} fetched successfully:`,
        response.data,
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du restaurant ${restaurantId}:`,
        error.response?.status,
        error.response?.data,
        error.message,
      );
      return null;
    }
  }

  async fetchDeliverer(delivererId: number): Promise<Deliverer | null> {
    try {
      const route = `users/interservice/${delivererId}`;
      const token = this.generateJwtTokenForDelivery();
      console.log(`Fetching deliverer ${delivererId} with token: ${token}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.deliveryServiceUrl}/${route}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      console.log(
        `Deliverer ${delivererId} fetched successfully:`,
        response.data,
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du livreur ${delivererId}:`,
        error.response?.status,
        error.response?.data,
        error.message,
      );
      return null;
    }
  }

  async fetchMenuItem(menuItemId: number): Promise<MenuItem | null> {
    try {
      const route = `menu-items/interservice/${menuItemId}`;
      const token = this.generateJwtTokenForRestaurateur();
      console.log(`Fetching menuItem ${menuItemId} with token: ${token}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.restaurantServiceUrl}/${route}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      console.log(
        `MenuItem ${menuItemId} fetched successfully:`,
        response.data,
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du menu item ${menuItemId}:`,
        error.response?.status,
        error.response?.data,
        error.message,
      );
      return null;
    }
  }

  async fetchMenuItemOptionValue(
    optionValueId: string,
  ): Promise<MenuItemOptionValue | null> {
    try {
      const route = `menu-item-option-values/interservice/${optionValueId}`;
      const token = this.generateJwtTokenForRestaurateur();
      console.log(
        `Fetching menu item option value ${optionValueId} with token: ${token}`,
      );
      const response = await firstValueFrom(
        this.httpService.get(`${this.menuItemOptionValueUrl}/${route}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      console.log(
        `Menu item option value ${optionValueId} fetched successfully:`,
        response.data,
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du menu item option value ${optionValueId}:`,
        error.response?.status,
        error.response?.data,
        error.message,
      );
      return null;
    }
  }

  async fetchMenuItemOptionValues(
    optionValueIds: number[],
  ): Promise<MenuItemOptionValue[] | null> {
    if (!optionValueIds.length) return [];
    try {
      const optionValues = await Promise.all(
        optionValueIds.map(
          async (id) => await this.fetchMenuItemOptionValue(id.toString()),
        ),
      );
      return optionValues.filter(
        (value): value is MenuItemOptionValue => value !== null,
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des menu item option values ${optionValueIds}:`,
        error.message,
      );
      return null;
    }
  }

  async fetchDeliveryByOrderId(orderId: number): Promise<Delivery | null> {
    try {
      const route = `deliveries/interservice/order/${orderId}`;
      const token = this.generateJwtTokenForDelivery();
      console.log(`Fetching delivery for order ${orderId} with token: ${token}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.deliveryServiceUrl}/${route}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      console.log(
        `Delivery for order ${orderId} fetched successfully:`,
        response.data,
      );
      return response.data || null;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de la livraison pour la commande ${orderId}:`,
        error.response?.status,
        error.response?.data,
        error.message,
      );
      return null;
    }
  }
}