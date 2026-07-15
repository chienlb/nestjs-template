import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/postgre-sql/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private firebaseApp: App | null = null;
  private isMockMode = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (projectId && clientEmail && privateKey) {
      try {
        let formattedPrivateKey = privateKey.trim();
        if (formattedPrivateKey.endsWith(',')) {
          formattedPrivateKey = formattedPrivateKey
            .substring(0, formattedPrivateKey.length - 1)
            .trim();
        }
        if (
          formattedPrivateKey.startsWith('"') &&
          formattedPrivateKey.endsWith('"')
        ) {
          formattedPrivateKey = formattedPrivateKey.substring(
            1,
            formattedPrivateKey.length - 1,
          );
        } else if (
          formattedPrivateKey.startsWith("'") &&
          formattedPrivateKey.endsWith("'")
        ) {
          formattedPrivateKey = formattedPrivateKey.substring(
            1,
            formattedPrivateKey.length - 1,
          );
        }
        formattedPrivateKey = formattedPrivateKey.trim();
        if (formattedPrivateKey.endsWith(',')) {
          formattedPrivateKey = formattedPrivateKey
            .substring(0, formattedPrivateKey.length - 1)
            .trim();
        }
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');

        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        });

        this.logger.log('FCM initialized successfully.');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `FCM initialization failed: ${errMsg}. Switching to Mock Mode.`,
        );
        this.isMockMode = true;
      }
    } else {
      this.logger.warn(
        'FCM credentials not fully configured in env. Running in MOCK MODE.',
      );
      this.isMockMode = true;
    }
  }

  /**
   * Register or update a device token for a user
   */
  async registerDevice(userId: string, token: string, deviceType?: string) {
    const data = {
      userId,
      token,
      deviceType: deviceType || null,
    };

    // Upsert device token
    const device = await this.prisma.userDevice.upsert({
      where: { token },
      update: { userId, deviceType: deviceType || null },
      create: data,
    });

    // Write audit log
    void this.auditLogService.log(userId, 'REGISTER_DEVICE_TOKEN', {
      tokenId: device.id,
      deviceType: device.deviceType,
    });

    return device;
  }

  /**
   * Remove a device token (e.g. on logout)
   */
  async removeDevice(token: string) {
    try {
      const device = await this.prisma.userDevice.findUnique({
        where: { token },
      });
      if (device) {
        await this.prisma.userDevice.delete({ where: { token } });
        void this.auditLogService.log(device.userId, 'REMOVE_DEVICE_TOKEN', {
          tokenId: device.id,
          deviceType: device.deviceType,
        });
      }
      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to remove device token: ${errMsg}`);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Send notification to a specific token
   */
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    userId: string | null = null,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const payload = {
      notification: { title, body },
      data: data || {},
    };

    if (this.isMockMode || !this.firebaseApp) {
      this.logger.log(
        `[FCM MOCK] Sending push to device ${token}: ${JSON.stringify(payload)}`,
      );

      void this.auditLogService.log(userId, 'SEND_FCM_NOTIFICATION_MOCK', {
        token,
        payload,
        status: 'success',
        mock: true,
      });

      return { success: true, messageId: `mock-msg-${Date.now()}` };
    }

    try {
      const message: Message = {
        token,
        notification: { title, body },
        data: data || {},
      };

      const messageId = await getMessaging(this.firebaseApp).send(message);

      void this.auditLogService.log(userId, 'SEND_FCM_NOTIFICATION_SUCCESS', {
        token,
        payload,
        messageId,
      });

      return { success: true, messageId };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `FCM failed to send message to token ${token}: ${errMsg}`,
      );

      void this.auditLogService.log(userId, 'SEND_FCM_NOTIFICATION_FAILED', {
        token,
        payload,
        error: errMsg,
      });

      return { success: false, error: errMsg };
    }
  }

  /**
   * Send notification to all devices of a specific user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{
    success: boolean;
    results: Array<{
      token: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }> {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
    });

    if (devices.length === 0) {
      this.logger.warn(`No registered devices found for user ${userId}.`);
      void this.auditLogService.log(
        userId,
        'SEND_FCM_NOTIFICATION_NO_DEVICES',
        {
          title,
          body,
          data: data || {},
        },
      );
      return { success: false, results: [] };
    }

    const results = await Promise.all(
      devices.map(async (device) => {
        const res = await this.sendToDevice(
          device.token,
          title,
          body,
          data,
          userId,
        );
        return {
          token: device.token,
          success: res.success,
          messageId: res.messageId,
          error: res.error,
        };
      }),
    );

    const someSuccess = results.some((r) => r.success);
    return { success: someSuccess, results };
  }
}
