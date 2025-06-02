import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthValidationService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Vérifie un utilisateur via une route inter-service.
   * @param userId - L'ID de l'utilisateur à vérifier.
   * @param role - Le rôle de l'utilisateur (client, restaurateur, livreur, admin).
   * @param token - Le token JWT pour l'authentification.
   * @returns Promise<void> - Lance une exception si la vérification échoue.
   */
  async verifyUser(userId: string, role: 'client' | 'restaurateur' | 'livreur' | 'admin', token: string): Promise<void> {
    try {
      const roleToServiceMap: Record<string, string> = {
        client: 'client-service.client.svc.cluster.local:3001/users',
        restaurateur: 'restaurateur-service.restaurateur.svc.cluster.local:3002/users',
        livreur: 'livreur-service.livreur.svc.cluster.local:3003/users',
        admin: 'admin-service.admin.svc.cluster.local:3004/users',
      };

      const serviceUrl = roleToServiceMap[role];
      if (!serviceUrl) {
        throw new HttpException(`Rôle non supporté: ${role}`, HttpStatus.BAD_REQUEST);
      }

      const response = await firstValueFrom(
        this.httpService.get(`http://${serviceUrl}/verify/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      if (response.status !== 200) {
        throw new HttpException(`Vérification de ${role} échouée`, HttpStatus.FORBIDDEN);
      }
    } catch (err) {
      throw new HttpException(
        err.message || `Échec de la vérification de ${role}`,
        err.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}