import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let configService: {
    get: jest.Mock;
  };
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest
      .fn()
      .mockResolvedValue({ messageId: 'test-message-id' });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'mail.host') return 'smtp.example.com';
        if (key === 'mail.port') return 587;
        if (key === 'mail.user') return 'test@example.com';
        if (key === 'mail.pass') return 'password';
        if (key === 'mail.from') return '"Test" <test@example.com>';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email successfully', async () => {
    const mailOptions = {
      to: 'recipient@example.com',
      subject: 'Hello',
      text: 'World',
    };

    await service.sendMail(mailOptions);

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Test" <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Hello',
      text: 'World',
    });
  });

  it('should throw an error if sending fails', async () => {
    const errorMsg = 'SMTP Connection Error';
    mockSendMail.mockRejectedValue(new Error(errorMsg));

    const mailOptions = {
      to: 'recipient@example.com',
      subject: 'Hello',
      text: 'World',
    };

    await expect(service.sendMail(mailOptions)).rejects.toThrow(errorMsg);
  });
});
