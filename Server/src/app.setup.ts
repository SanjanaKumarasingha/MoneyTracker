import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

// Middleware, pipes, and routing shared by main.ts and the e2e tests, so the
// tests exercise exactly what production runs.
export function configureApp(
  app: NestExpressApplication,
  { isProduction }: { isProduction: boolean },
): void {
  // whitelist: drop any request-body field without a class-validator
  // decorator, so clients can't set columns a DTO never meant to expose.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger UI (dev only) needs inline scripts, so CSP is production-only.
  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

  if (isProduction) {
    // Behind Azure's front end every request arrives from the proxy, so
    // without this the login rate limit would be one shared bucket for all
    // users. Dev keeps the default - there a client could spoof the header.
    app.set('trust proxy', 1);
  }

  app.setGlobalPrefix('api/v1', {
    exclude: ['_ah/start'],
  });
}
