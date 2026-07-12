import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisService } from '../../database/redis/redis.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    clear: jest.Mock;
  };
  let redisService: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    client: {
      flushdb: jest.Mock;
    };
  };
  let configService: {
    get: jest.Mock;
  };

  const createServiceWithStore = async (storeType: 'memory' | 'redis') => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn(),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      client: {
        flushdb: jest.fn(),
      },
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'cache.store') return storeType;
        if (key === 'cache.ttl') return 60;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
        { provide: RedisService, useValue: redisService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    return module.get<CacheService>(CacheService);
  };

  describe('with Memory Cache', () => {
    beforeEach(async () => {
      service = await createServiceWithStore('memory');
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should get from cacheManager', async () => {
      cacheManager.get.mockResolvedValue('memory-value');
      const val = await service.get('key');
      expect(val).toBe('memory-value');
      expect(cacheManager.get).toHaveBeenCalledWith('key');
    });

    it('should set with ttl multiplied by 1000', async () => {
      await service.set('key', 'value', 10);
      expect(cacheManager.set).toHaveBeenCalledWith('key', 'value', 10000);
    });

    it('should delete from cacheManager', async () => {
      await service.del('key');
      expect(cacheManager.del).toHaveBeenCalledWith('key');
    });

    it('should clear cacheManager on reset', async () => {
      await service.reset();
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('with Redis Cache', () => {
    beforeEach(async () => {
      service = await createServiceWithStore('redis');
    });

    it('should get parsed JSON value from redisService', async () => {
      redisService.get.mockResolvedValue(JSON.stringify({ a: 1 }));
      const val = await service.get<{ a: number }>('key');
      expect(val).toEqual({ a: 1 });
      expect(redisService.get).toHaveBeenCalledWith('key');
    });

    it('should return null when key not found in redisService', async () => {
      redisService.get.mockResolvedValue(null);
      const val = await service.get('key');
      expect(val).toBeNull();
    });

    it('should set stringified value in redisService', async () => {
      await service.set('key', { a: 1 }, 10);
      expect(redisService.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ a: 1 }),
        10,
      );
    });

    it('should delete from redisService', async () => {
      await service.del('key');
      expect(redisService.del).toHaveBeenCalledWith('key');
    });

    it('should flushdb on reset', async () => {
      await service.reset();
      expect(redisService.client.flushdb).toHaveBeenCalled();
    });
  });
});
