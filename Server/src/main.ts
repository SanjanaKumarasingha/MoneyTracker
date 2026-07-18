import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const isProduction = configService.get<string>('NODE_ENV') == 'production';
  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api/v1', {
    exclude: ['_ah/start'],
  });

  if (!isProduction) {
    // allows the CRA dev server, LAN-hosted previews, and a phone running
    // Expo Go (over the LAN IP or an Expo tunnel) to all reach the API.
    const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
    const isLanOrigin =
      /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):\d+$/;
    const extraOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        // Native mobile requests (Expo Go, curl, server-to-server) carry no
        // Origin header at all - they aren't subject to CORS in the first
        // place, so let them through.
        if (!origin) return callback(null, true);

        if (
          isLocalOrigin.test(origin) ||
          isLanOrigin.test(origin) ||
          extraOrigins.includes(origin)
        ) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      },
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // generate Swagger document for manual testing
    const config = new DocumentBuilder()
      .setTitle('Expense Tracker')
      // .setDescription('')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document);
  }

  await app.listen(5000);
}
bootstrap();
