import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FcmService } from './fcm.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiProperty,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import type { Request } from 'express';

class RegisterDeviceDto {
  @ApiProperty({
    example: 'fcm-device-registration-token',
    description: 'FCM Token',
  })
  token: string;

  @ApiProperty({
    example: 'android',
    required: false,
    description: 'Device OS',
  })
  deviceType?: string;
}

class SendNotificationDto {
  @ApiProperty({ example: 'user_123', description: 'Recipient User UUID' })
  targetUserId: string;

  @ApiProperty({ example: 'Chào Bạn', description: 'Notification Title' })
  title: string;

  @ApiProperty({
    example: 'Đây là thông báo từ hệ thống',
    description: 'Notification Body',
  })
  body: string;

  @ApiProperty({
    example: { key: 'value' },
    required: false,
    description: 'Custom metadata payload',
  })
  data?: Record<string, string>;
}

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Notifications & Audit')
@Controller()
export class FcmController {
  constructor(
    private readonly fcmService: FcmService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('devices/register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Register an FCM registration token for the logged-in user',
  })
  @ApiResponse({ status: 201, description: 'Token registered successfully' })
  async registerDevice(
    @Body() body: RegisterDeviceDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.fcmService.registerDevice(userId, body.token, body.deviceType);
  }

  @Post('notifications/send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a push notification to a user' })
  @ApiResponse({ status: 201, description: 'Notification dispatch executed' })
  async sendNotification(
    @Body() body: SendNotificationDto,
    @Req() req: RequestWithUser,
  ) {
    const senderUserId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const rawUserAgent = req.headers['user-agent'];
    const userAgent =
      typeof rawUserAgent === 'string' ? rawUserAgent : undefined;

    const result = await this.fcmService.sendToUser(
      body.targetUserId,
      body.title,
      body.body,
      body.data,
    );

    // Audit-log the REST endpoint trigger itself under the sender's user ID
    void this.auditLogService.log(
      senderUserId,
      'API_TRIGGERED_NOTIFICATION',
      {
        title: body.title,
        body: body.body,
        data: body.data || {},
        targetUserId: body.targetUserId,
        success: result.success,
      },
      { ipAddress, userAgent },
    );

    return result;
  }

  @Get('audit-logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve system audit logs for debugging' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of logs to fetch',
  })
  @ApiResponse({ status: 200, description: 'Recent audit log entries' })
  async getAuditLogs(@Query('limit') limit?: string) {
    const logLimit = limit ? Number(limit) : 100;
    return this.auditLogService.getRecentLogs(logLimit);
  }
}
