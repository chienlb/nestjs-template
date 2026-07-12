import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { RedisService } from '../../database/redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly storeType: string;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: cacheManager.Cache,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.storeType = this.configService.get<string>('cache.store') || 'memory';
  }

  /**
   * Get value from cache.
   * @param key cache key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.storeType === 'redis') {
        const val = await this.redisService.get(key);
        return val ? (JSON.parse(val) as T) : null;
      }
      return (await this.cacheManager.get<T>(key)) ?? null;
    } catch (error) {
      this.logger.error(
        `Failed to get cache key "${key}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL.
   * @param key cache key
   * @param value data to cache
   * @param ttlSeconds TTL in seconds (falls back to configured default TTL if omitted)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const defaultTtl = this.configService.get<number>('cache.ttl') || 60;
      const ttl = ttlSeconds !== undefined ? ttlSeconds : defaultTtl;

      if (this.storeType === 'redis') {
        await this.redisService.set(key, JSON.stringify(value), ttl);
      } else {
        // cache-manager memory store uses milliseconds in NestJS, convert ttl to ms
        await this.cacheManager.set(key, value, ttl * 1000);
      }
    } catch (error) {
      this.logger.error(
        `Failed to set cache key "${key}": ${(error as Error).message}`,
      );
    }
  }

  /**
   * Delete key from cache.
   * @param key cache key
   */
  async del(key: string): Promise<void> {
    try {
      if (this.storeType === 'redis') {
        await this.redisService.del(key);
      } else {
        await this.cacheManager.del(key);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete cache key "${key}": ${(error as Error).message}`,
      );
    }
  }

  /**
   * Reset/clear the cache.
   */
  async reset(): Promise<void> {
    try {
      if (this.storeType === 'redis') {
        await this.redisService.client.flushdb();
      } else {
        await this.cacheManager.clear();
      }
    } catch (error) {
      this.logger.error(`Failed to reset cache: ${(error as Error).message}`);
    }
  }
}
