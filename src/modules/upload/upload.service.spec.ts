import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';
import { BadRequestException } from '@nestjs/common';

// Mock S3Client
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockResolvedValue({}),
      };
    }),
    PutObjectCommand: jest.fn().mockImplementation((args: unknown) => args),
    HeadBucketCommand: jest.fn().mockImplementation((args: unknown) => args),
  };
});

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'r2.accountId': 'test-account-id',
                'r2.accessKeyId': 'test-access-key-id',
                'r2.secretAccessKey': 'test-secret-access-key',
                'r2.bucketName': 'test-bucket',
                'r2.publicUrl': 'https://media.test.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully upload a file and return url and key', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test-image.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('mock file buffer'),
        size: 100,
      } as Express.Multer.File;

      const result = await service.uploadFile(mockFile, 'test-folder');

      expect(result).toBeDefined();
      expect(result.url).toContain('https://media.test.com/test-folder/');
      expect(result.url).toContain('.png');
      expect(result.key).toContain('test-folder/');
      expect(result.key).toContain('.png');
    });

    it('should throw BadRequestException if file is invalid', async () => {
      await expect(
        service.uploadFile(null as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
