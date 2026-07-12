import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get application health status including database, cache, and storage',
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        details: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: { status: { type: 'string', example: 'up' } },
            },
            redis: {
              type: 'object',
              properties: { status: { type: 'string', example: 'up' } },
            },
            storage: {
              type: 'object',
              properties: { status: { type: 'string', example: 'up' } },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'System is unhealthy / degraded',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        details: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
                error: { type: 'string' },
              },
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
                error: { type: 'string' },
              },
            },
            storage: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async check(@Res() res: Response) {
    const health = await this.healthService.checkHealth();

    if (health.status === 'ok') {
      return res.status(HttpStatus.OK).json(health);
    }

    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(health);
  }
}
