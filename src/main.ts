import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Server');
  try {
    const app = await NestFactory.create(AppModule);

    // Enable shutdown hooks for graceful shutdown (like closing database pool)
    app.enableShutdownHooks();

    // 1. Enable CORS
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // 2. Global Validation Pipe
    app.useGlobalPipes(
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

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port') || 3000;

    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error('Failed to start NestJS application', error);
    process.exit(1);
  }
}
void bootstrap();
