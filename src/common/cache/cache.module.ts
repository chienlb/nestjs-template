import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import { RedisModule } from '../../database/redis/redis.module';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: false,
    }),
    RedisModule,
  ],
  providers: [CacheService, HttpCacheInterceptor],
  exports: [CacheService, HttpCacheInterceptor],
})
export class CacheModule {}
