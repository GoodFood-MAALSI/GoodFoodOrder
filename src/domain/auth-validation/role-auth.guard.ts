import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Type,
  mixin,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

// Base class pour la garde avec logique partagée
class RoleAuthGuardBase implements CanActivate {
  constructor(private readonly role: 'client' | 'restaurateur' | 'livreur' | 'admin') {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];

    if (!token) {
      throw new HttpException('Token manquant', HttpStatus.UNAUTHORIZED);
    }

    try {
      const secrets: Record<string, string | undefined> = {
        client: process.env.CLIENT_SECRET,
        admin: process.env.ADMIN_SECRET,
        restaurateur: process.env.RESTAURATEUR_SECRET,
        livreur: process.env.LIVREUR_SECRET,
      };

      const secret = secrets[this.role];
      if (!secret) {
        throw new HttpException(`Secret manquant pour le rôle: ${this.role}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const decoded = jwt.verify(token, secret) as { id: string; role: string };

      if (!decoded || !decoded.role) {
        throw new HttpException('Token invalide', HttpStatus.UNAUTHORIZED);
      }

      if (decoded.role !== this.role) {
        throw new HttpException(`Rôle requis: ${this.role}`, HttpStatus.FORBIDDEN);
      }

      request.auth = { id: decoded.id, role: decoded.role };
      return true;
    } catch (err) {
      throw new HttpException(
        err instanceof HttpException ? err.getResponse().toString() : 'Erreur d\'authentification',
        err instanceof HttpException ? err.getStatus() : HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

// Factory: retourne une garde dynamique avec le rôle injecté
export function RoleAuthGuard(role: 'client' | 'restaurateur' | 'livreur' | 'admin'): Type<CanActivate> {
  @Injectable()
  class RoleAuthMixin extends RoleAuthGuardBase {
    constructor() {
      super(role);
    }
  }

  return mixin(RoleAuthMixin);
}