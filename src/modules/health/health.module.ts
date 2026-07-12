import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../../database/postgre-sql/prisma.module';
import { RedisModule } from '../../database/redis/redis.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, RedisModule, UploadModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
