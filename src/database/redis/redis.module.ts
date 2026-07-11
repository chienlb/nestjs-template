import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        });
        
        client.on('connect', () => {
          import('@nestjs/common').then(({ Logger }) => {
            Logger.log('Successfully connected to Redis', 'RedisModule');
          });
        });

        client.on('error', (err) => {
          import('@nestjs/common').then(({ Logger }) => {
            Logger.error('Redis connection error', err, 'RedisModule');
          });
        });

        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
