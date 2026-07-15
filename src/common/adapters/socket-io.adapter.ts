import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class SocketIoAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const configService = this.app.get(ConfigService);
    const corsOrigins = configService.get<string[]>('security.corsOrigins') || [
      '*',
    ];

    const corsOptions = {
      origin:
        corsOrigins.length === 1 && corsOrigins[0] === '*' ? '*' : corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    };

    const optionsWithCors: any = {
      ...options,
      cors: corsOptions,
    };

    return super.createIOServer(port, optionsWithCors);
  }
}
