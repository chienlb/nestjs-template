import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accountId = this.configService.get<string>('r2.accountId') || '';
    const accessKeyId = this.configService.get<string>('r2.accessKeyId') || '';
    const secretAccessKey =
      this.configService.get<string>('r2.secretAccessKey') || '';
    this.bucketName = this.configService.get<string>('r2.bucketName') || '';
    this.publicUrl = this.configService.get<string>('r2.publicUrl') || '';

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
      this.logger.warn(
        'Cloudflare R2 configuration is missing or incomplete. Uploads may fail.',
      );
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Check the health of Cloudflare R2 bucket connectivity.
   */
  async checkHealth(): Promise<{
    status: 'up' | 'down' | 'unconfigured';
    error?: string;
  }> {
    const accountId = this.configService.get<string>('r2.accountId') || '';
    const accessKeyId = this.configService.get<string>('r2.accessKeyId') || '';
    const secretAccessKey =
      this.configService.get<string>('r2.secretAccessKey') || '';
    const bucketName = this.configService.get<string>('r2.bucketName') || '';

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return { status: 'unconfigured' };
    }

    try {
      await this.s3Client.send(
        new HeadBucketCommand({
          Bucket: this.bucketName,
        }),
      );
      return { status: 'up' };
    } catch (error) {
      this.logger.error(
        `R2 Storage health check failed: ${(error as Error).message}`,
      );
      return { status: 'down', error: (error as Error).message };
    }
  }

  /**
   * Upload a file to Cloudflare R2 bucket.
   * @param file The file object from Express.Multer.File
   * @param folder Optional directory prefix for the object key
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<{ url: string; key: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file payload');
    }

    const fileExtension = file.originalname.split('.').pop() || '';
    const uniqueId = crypto.randomUUID();
    // Normalize folder name, remove leading/trailing slashes
    const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
    const filename = fileExtension ? `${uniqueId}.${fileExtension}` : uniqueId;
    const key = normalizedFolder ? `${normalizedFolder}/${filename}` : filename;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const formattedPublicUrl = this.publicUrl
        ? this.publicUrl.replace(/\/+$/, '')
        : '';
      const url = formattedPublicUrl ? `${formattedPublicUrl}/${key}` : key;

      return {
        url,
        key,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to R2: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new BadRequestException('File upload failed');
    }
  }
}
