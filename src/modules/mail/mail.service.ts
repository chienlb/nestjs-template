import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!user || !pass) {
      this.logger.warn(
        'Mail service SMTP credentials (MAIL_USER / MAIL_PASS) are not configured. Email sending may fail.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports (like 587)
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Send an email using configured SMTP settings.
   * @param options nodemailer SendMailOptions
   */
  async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    const defaultFrom = this.configService.get<string>('mail.from');

    const mailOptions = {
      from: defaultFrom,
      ...options,
    };

    const toField = mailOptions.to;
    const recipients =
      typeof toField === 'string'
        ? toField
        : Array.isArray(toField)
          ? toField
              .map((r) =>
                typeof r === 'string' ? r : (r as { address: string }).address,
              )
              .join(', ')
          : toField && typeof toField === 'object' && 'address' in toField
            ? (toField as { address: string }).address
            : String(toField || '');

    try {
      this.logger.log(
        `Sending email to ${recipients} with subject "${mailOptions.subject || ''}"`,
      );
      const info = (await this.transporter.sendMail(mailOptions)) as {
        messageId?: string;
      };
      this.logger.log(`Email sent successfully: ${info.messageId || ''}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${recipients}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
