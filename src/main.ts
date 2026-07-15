import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
// import { doubleCsrf } from 'csrf-csrf';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { SocketIoAdapter } from './common/adapters/socket-io.adapter';

async function bootstrap() {
  const logger = new Logger('Server');
  try {
    const app = await NestFactory.create(AppModule);

    // Enable shutdown hooks for graceful shutdown (like closing database pool)
    app.enableShutdownHooks();

    // Register WebSocket adapter
    app.useWebSocketAdapter(new SocketIoAdapter(app));

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port') || 3000;
    const corsOrigins = configService.get<string[]>('security.corsOrigins') || [
      '*',
    ];
    const csrfSecret =
      configService.get<string>('security.csrfSecret') || 'default-csrf-secret';

    // 1. HTTP Security Headers (Helmet)
    app.use(helmet());

    // 2. Compression
    app.use(compression());

    // 3. Cookie Parser
    app.use(cookieParser(csrfSecret));

    // 4. Configurable CORS
    app.enableCors({
      origin:
        corsOrigins.length === 1 && corsOrigins[0] === '*' ? '*' : corsOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // 5. CSRF Protection (Configured, ready for cookie-based sessions)
    // To enable, uncomment the block below:
    // const { doubleCsrfProtection } = doubleCsrf({
    //   getSecret: () => csrfSecret,
    //   cookieName: 'x-csrf-token',
    //   cookieOptions: {
    //     sameSite: 'lax',
    //     path: '/',
    //     secure: process.env.NODE_ENV === 'production',
    //   },
    //   size: 64,
    //   ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    //   getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
    //   getSessionIdentifier: (req) => {
    //     return (req.headers['authorization'] as string) || req.ip || '';
    //   },
    // });
    // app.use(doubleCsrfProtection);

    // 6. Global Validation and Sanitization Pipes
    app.useGlobalPipes(
      new SanitizePipe(),
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    // 3. Global Interceptor & Filter
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    // 4. Swagger API Documentation
    const config = new DocumentBuilder()
      .setTitle('NestJS Template API')
      .setDescription('Tài liệu API mô tả dự án NestJS Template')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error('Failed to start NestJS application', error);
    process.exit(1);
  }
}
void bootstrap();
