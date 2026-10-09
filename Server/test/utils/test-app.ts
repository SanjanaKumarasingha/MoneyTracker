// Must run before any module import below: AuthModule reads JWT_SECRET from
// process.env at import time.
import 'dotenv/config';

import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { createConnection } from 'mysql2/promise';

import { configureApp } from '../../src/app.setup';
import { UsersModule } from '../../src/users/users.module';
import { CategoriesModule } from '../../src/categories/categories.module';
import { RecordsModule } from '../../src/records/records.module';
import { AuthModule } from '../../src/auth/auth.module';
import { WalletsModule } from '../../src/wallets/wallets.module';
import { GoalsModule } from '../../src/goals/goals.module';

// Every e2e suite runs against this throwaway database. Its schema is dropped
// and rebuilt from the entities each time a suite boots, so it never touches
// the dev database - and suites must run serially (--runInBand).
export const TEST_DB = process.env.DB_TEST_DATABASE ?? 'moneytracker_test';

if (!TEST_DB.endsWith('_test')) {
  throw new Error(
    `Refusing to run: DB_TEST_DATABASE "${TEST_DB}" must end in "_test" - e2e suites drop its schema.`,
  );
}

export type Session = { id: number; token: string };

export const authHeader = (s: Session) => ({
  Authorization: `Bearer ${s.token}`,
});

export async function createTestApp(): Promise<NestExpressApplication> {
  const conn = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\``);
  await conn.end();

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot(),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
      TypeOrmModule.forRoot({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 3306),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: TEST_DB,
        autoLoadEntities: true,
        dropSchema: true,
        synchronize: true,
      }),
      UsersModule,
      CategoriesModule,
      RecordsModule,
      AuthModule,
      WalletsModule,
      GoalsModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app, { isProduction: false });
  await app.init();
  return app;
}

export async function signUp(
  app: NestExpressApplication,
  name: string,
  password = 'Password123!',
): Promise<Session> {
  const api = () => request(app.getHttpServer());

  const created = await api()
    .post('/api/v1/users')
    .send({ username: name, email: `${name}@example.com`, password })
    .expect(201);

  const login = await api()
    .post('/api/v1/auth/login')
    .send({ username: name, password })
    .expect(201);

  return { id: created.body.id, token: login.body.access_token };
}
