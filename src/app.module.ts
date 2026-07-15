import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import envConfig from './config/env.config';
import { PrismaModule } from './database/postgre-sql/prisma.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from './database/redis/redis.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { UploadModule } from './modules/upload/upload.module';
import { CacheModule } from './common/cache/cache.module';
import { MailModule } from './modules/mail/mail.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { FcmModule } from './modules/fcm/fcm.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    UploadModule,
    CacheModule,
    MailModule,
    HealthModule,
    UserModule,
    WebsocketModule,
    AuditLogModule,
    FcmModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
