import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyJwt } from '../utils/token.util';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: Record<string, unknown> }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Yêu cầu token xác thực');
    }

    try {
      const jwtSecret =
        this.configService.get<string>('jwt.secret') || 'defaultSecret';
      const decoded = verifyJwt<Record<string, unknown>>(token, jwtSecret);

      request.user = {
        id: decoded['id'] as string,
        email: decoded['email'] as string,
        role: decoded['role'] as string,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1] || null;
    }

    const tokenFromQuery = request.query['token'];
    if (typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    return null;
  }
}
