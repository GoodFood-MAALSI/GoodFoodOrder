import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Type } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RolesAuthGuard implements CanActivate {
  private allowedRoles: Array<'client' | 'restaurateur' | 'livreur' | 'admin'>;

  constructor(
    @Inject(HttpService) private readonly httpService: HttpService,
  ) {}

  // Méthode à appeler après l'instanciation
  setRoles(roles: Array<'client' | 'restaurateur' | 'livreur' | 'admin'>) {
    this.allowedRoles = roles;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];

    if (!token) {
      throw new HttpException('Token manquant', HttpStatus.UNAUTHORIZED);
    }

    try {
      let decoded: { id: string; role: string } | null = null;
      let userRole: string | null = null;

      const secrets: Record<string, string | undefined> = {
        restaurateur: process.env.RESTAURATEUR_SECRET,
        client: process.env.CLIENT_SECRET,
        admin: process.env.ADMIN_SECRET,
        livreur: process.env.LIVREUR_SECRET,
      };

      const roleToServiceMap: Record<string, string> = {
        restaurateur: 'restaurateur-service.restaurateur.svc.cluster.local:3002/users',
        client: 'client-service.client.svc.cluster.local:3001/users',
        admin: 'admin-service.admin.svc.cluster.local:3004/users',
        livreur: 'livreur-service.livreur.svc.cluster.local:3003/users',
      };

      for (const role of this.allowedRoles) {
        try {
          const secret = secrets[role];
          if (!secret) {
            continue; // Pas de secret => ignorer ce rôle
          }

          const verified = jwt.verify(token, secret);
          if (!verified || typeof verified !== 'object') {
            continue; // Si decoded est null ou pas un objet, on skip
          }

          decoded = verified as { id: string; role: string };

          if (decoded.role === role) {
            userRole = decoded.role;

            const response = await firstValueFrom(
              this.httpService.get(`http://${roleToServiceMap[role]}/verify/${decoded.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
            );

            if (response.status === 200) {
              request.auth = { id: decoded.id, role: userRole };
              return true;
            }
          }
        } catch {
          continue;
        }
      }

      throw new HttpException('Rôle non autorisé, token invalide ou utilisateur inexistant', HttpStatus.FORBIDDEN);
    } catch (err) {
      throw err instanceof HttpException
        ? err
        : new HttpException('Erreur d\'authentification', HttpStatus.UNAUTHORIZED);
    }
  }
}

export const RoleAuthGuardFactory = (
  roles: Array<'client' | 'restaurateur' | 'livreur' | 'admin'>,
): Type<CanActivate> => {
  @Injectable()
  class ConfiguredGuard extends RolesAuthGuard {
    constructor(httpService: HttpService) {
      super(httpService);
      this.setRoles(roles);
    }
  }
  return ConfiguredGuard;
};