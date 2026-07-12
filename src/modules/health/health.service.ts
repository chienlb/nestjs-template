import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/postgre-sql/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Run health checks in parallel across core dependencies
   */
  async checkHealth() {
    const [db, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    // Storage status of 'unconfigured' does not fail the overall application health
    const overallStatus =
      db.status === 'up' &&
      redis.status === 'up' &&
      (storage.status === 'up' || storage.status === 'unconfigured')
        ? 'ok'
        : 'error';

    return {
      status: overallStatus,
      details: {
        database: db,
        redis: redis,
        storage: storage,
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    error?: string;
  }> {
    try {
      await this.prismaService.$queryRawUnsafe('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      this.logger.error(
        `Database health check failed: ${(error as Error).message}`,
      );
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async checkRedis(): Promise<{
    status: 'up' | 'down';
    error?: string;
  }> {
    try {
      await this.redisService.client.ping();
      return { status: 'up' };
    } catch (error) {
      this.logger.error(
        `Redis health check failed: ${(error as Error).message}`,
      );
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async checkStorage() {
    return this.uploadService.checkHealth();
  }
}
