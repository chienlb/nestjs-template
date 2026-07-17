import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/modules/mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';

// 1. Custom ENV Parser to avoid external dependency issues
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        value = value.replace(/\\n/g, '\n');
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

async function bootstrap() {
  const recipient = process.argv[2];
  if (!recipient) {
    console.error(
      'Error: Please provide a recipient email address as an argument.',
    );
    console.error('Example: pnpm run test:mail your-email@example.com');
    process.exit(1);
  }

  console.log('=== Mail Service Integration Test ===');
  console.log(`Target Recipient: ${recipient}`);
  console.log('Bootstrapping NestJS application context...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'], // display log events to monitor the process
    });

    console.log('Resolving MailService...');
    const mailService = app.get(MailService);

    console.log('Sending test email...');
    const startTime = Date.now();

    await mailService.sendMail({
      to: recipient,
      subject: 'NestJS Template - Test Email Notification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px;">
          <h2 style="color: #4CAF50;">Verification Success!</h2>
          <p>Hi there,</p>
          <p>This is a successful integration test email sent via <b>NestJS MailService</b>.</p>
          <p>If you received this, it means your SMTP configuration (host, port, user, and credentials) is working perfectly!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">
            Sent at: ${new Date().toString()}<br/>
            Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds
          </p>
        </div>
      `,
    });

    console.log('🎉 Email sent successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Mail Service Test Failed!');
    console.error(error);
    process.exit(1);
  }
}

void bootstrap();
