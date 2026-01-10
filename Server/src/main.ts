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
    // allows frontend and backend run on multiple ports
    app.enableCors({
      origin: /^https?:\/\/((localhost)|(127\.0\.0\.1)):\d{4}$/,
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
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
