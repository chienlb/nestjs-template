import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/postgre-sql/prisma.service';
import { AuditLog, Prisma } from '@prisma/client';

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log record
   */
  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  /**
   * Find audit logs matching options
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput;
    where?: Prisma.AuditLogWhereInput;
  }): Promise<AuditLog[]> {
    const { skip, take, orderBy, where } = params;
    return this.prisma.auditLog.findMany({
      skip,
      take,
      orderBy,
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
