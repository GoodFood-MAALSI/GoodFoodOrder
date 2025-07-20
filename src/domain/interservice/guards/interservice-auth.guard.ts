import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Type,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InterserviceAuthGuard implements CanActivate {
  private allowedRoles: Array<
    'client' | 'restaurateur' | 'deliverer' | 'super-admin' | 'admin'
  >;

  constructor(
    @Inject(HttpService) private readonly httpService: HttpService,
  ) {}

  // Méthode à appeler après l'instanciation
  setRoles(
    roles: Array<
      'client' | 'restaurateur' | 'deliverer' | 'super-admin' | 'admin'
    >,
  ) {
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

      // Vérification des rôles et association des secrets
      const secrets: Record<string, string | undefined> = {
        restaurateur: process.env.RESTAURATEUR_SECRET,
        client: process.env.CLIENT_SECRET,
        'super-admin': process.env.ADMINISTRATEUR_SECRET,
        admin: process.env.ADMINISTRATEUR_SECRET,
        deliverer: process.env.DELIVERY_SECRET,
      };

      // Mappage des rôles vers leurs services respectifs
      const roleToServiceMap: Record<string, string> = {
        restaurateur:
          'restaurateur-service.restaurateur.svc.cluster.local:3002/users',
        client: 'client-service.client.svc.cluster.local:3001/users',
        'super-admin':
          'administrateur-service.administrateur.svc.cluster.local:3004/users',
        admin:
          'administrateur-service.administrateur.svc.cluster.local:3004/users',
        deliverer: 'delivery-service.delivery.svc.cluster.local:3003/users',
      };

      for (const role of this.allowedRoles) {
        try {
          const secret = secrets[role];
          decoded = jwt.verify(token, secret) as any;
          if (decoded.role === role) {
            userRole = decoded.role;

            const response = await firstValueFrom(
              this.httpService.get(
                `http://${roleToServiceMap[role]}/verify/${decoded.id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              ),
            );

            if (response.status === 200) {
              request.user = { id: decoded.id, role: userRole };
              return true;
            }
          }
        } catch (err) {
          continue;
        }
      }

      throw new HttpException(
        'Rôle non autorisé, token invalide ou utilisateur inexistant',
        HttpStatus.FORBIDDEN,
      );
    } catch (err) {
      throw err instanceof HttpException
        ? err
        : new HttpException(
            "Erreur d'authentification",
            HttpStatus.UNAUTHORIZED,
          );
    }
  }
}

export const InterserviceAuthGuardFactory = (
  roles: Array<
    'client' | 'restaurateur' | 'deliverer' | 'super-admin' | 'admin'
  >,
): Type<CanActivate> => {
  @Injectable()
  class ConfiguredGuard extends InterserviceAuthGuard {
    constructor(httpService: HttpService) {
      super(httpService);
      this.setRoles(roles);
    }
  }
  return ConfiguredGuard;
};
