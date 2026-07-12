import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Retrieve metadata (if customized via standard CacheKey / CacheTTL decorators)
    // NestJS CacheManager metadata keys: 'cache_metadata_key', 'cache_metadata_ttl'
    const cacheKeyMeta = this.reflector.get<string>(
      'cache_metadata_key',
      context.getHandler(),
    );
    const cacheTtlMeta = this.reflector.get<number>(
      'cache_metadata_ttl',
      context.getHandler(),
    );

    const cacheKey = cacheKeyMeta || `http_cache:${url}`;

    try {
      const cachedResponse = await this.cacheService.get(cacheKey);
      if (cachedResponse !== null) {
        return of(cachedResponse);
      }

      return next.handle().pipe(
        tap((response) => {
          if (response !== undefined) {
            this.cacheService
              .set(cacheKey, response, cacheTtlMeta)
              .catch(() => {});
          }
        }),
      );
    } catch {
      // Degrade gracefully: on cache failures, allow request processing to continue
      return next.handle();
    }
  }
}
