import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/postgre-sql/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import { UploadService } from '../upload/upload.service';
import { HealthStatus, HealthResponse } from './health.controller';

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
  async checkHealth(): Promise<HealthResponse> {
    const [db, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    // Overall status is 'healthy' if all core components are healthy
    // It is 'degraded' if db/redis are healthy but storage is unhealthy (or config missing, depending on needs. If config is 'unconfigured', we treat it as healthy)
    const overallStatus: HealthStatus =
      db.status === 'healthy' && redis.status === 'healthy'
        ? storage.status === 'healthy'
          ? 'healthy'
          : 'degraded'
        : 'unhealthy';

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
    status: HealthStatus;
    error?: string;
  }> {
    try {
      await this.prismaService.$queryRawUnsafe('SELECT 1');
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error(
        `Database health check failed: ${(error as Error).message}`,
      );
      return { status: 'unhealthy', error: (error as Error).message };
    }
  }

  private async checkRedis(): Promise<{
    status: HealthStatus;
    error?: string;
  }> {
    try {
      await this.redisService.client.ping();
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error(
        `Redis health check failed: ${(error as Error).message}`,
      );
      return { status: 'unhealthy', error: (error as Error).message };
    }
  }

  private async checkStorage(): Promise<{
    status: HealthStatus;
    error?: string;
  }> {
    const r2Health = await this.uploadService.checkHealth();

    let status: HealthStatus = 'unhealthy';
    if (r2Health.status === 'up' || r2Health.status === 'unconfigured') {
      status = 'healthy';
    }

    return {
      status,
      error: r2Health.error,
    };
  }
}
