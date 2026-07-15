import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { AuditLog, Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Log system activity into the database
   */
  async log(
    userId: string | null,
    action: string,
    details: Record<string, unknown>,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuditLog> {
    const data: Prisma.AuditLogCreateInput = {
      action,
      details: (details as Prisma.InputJsonValue) || {},
      ipAddress: meta?.ipAddress || null,
      userAgent: meta?.userAgent || null,
    };

    if (userId) {
      data.user = { connect: { id: userId } };
    }

    return this.auditLogRepository.create(data);
  }

  /**
   * Fetch recent audit logs
   */
  async getRecentLogs(limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.findAll({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
