import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogRepository } from './audit-log.repository';
import { PrismaModule } from '../../database/postgre-sql/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService, AuditLogRepository],
  exports: [AuditLogService],
})
export class AuditLogModule {}
