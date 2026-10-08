// Must run before any module import below: AuthModule reads JWT_SECRET from
// process.env at import time.
import 'dotenv/config';

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { createConnection } from 'mysql2/promise';

import { UsersModule } from '../src/users/users.module';
import { CategoriesModule } from '../src/categories/categories.module';
import { RecordsModule } from '../src/records/records.module';
import { AuthModule } from '../src/auth/auth.module';
import { WalletsModule } from '../src/wallets/wallets.module';
import { GoalsModule } from '../src/goals/goals.module';

// Authorization regression tests: user B must never be able to read or
// modify anything owned by user A. Runs against a throwaway database whose
// schema is dropped and rebuilt from the entities on every run, so it never
// touches the dev database.
const TEST_DB = process.env.DB_TEST_DATABASE ?? 'moneytracker_test';

if (!TEST_DB.endsWith('_test')) {
  throw new Error(
    `Refusing to run: DB_TEST_DATABASE "${TEST_DB}" must end in "_test" - this suite drops its schema.`,
  );
}

type Session = { id: number; token: string };

describe('Resource ownership (e2e)', () => {
  let app: INestApplication;
  let alice: Session;
  let bob: Session;

  // Alice's resources, which Bob will try to reach.
  let walletId: number;
  let categoryId: number;
  let recordId: number;
  let goalId: number;

  const api = () => request(app.getHttpServer());
  const as = (s: Session) => ({ Authorization: `Bearer ${s.token}` });

  async function signUp(name: string): Promise<Session> {
    const password = 'Password123!';
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

  beforeAll(async () => {
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

    // Mirror main.ts.
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');
    await app.init();

    alice = await signUp('alice');
    bob = await signUp('bob');

    const wallet = await api()
      .post('/api/v1/wallets')
      .set(as(alice))
      .send({ name: 'Alice Cash', currency: 'LKR', userId: alice.id })
      .expect(201);
    walletId = wallet.body.id;

    // Registration seeds default categories - take one of Alice's.
    const categories = await api()
      .get('/api/v1/categories')
      .set(as(alice))
      .expect(200);
    categoryId = categories.body[0].id;

    const record = await api()
      .post('/api/v1/records')
      .set(as(alice))
      .send({
        price: 1500,
        date: '2026-10-01',
        remarks: 'groceries',
        wallet: { id: walletId },
        category: { id: categoryId },
      })
      .expect(201);
    recordId = record.body.id;

    const goal = await api()
      .post('/api/v1/goals')
      .set(as(alice))
      .send({
        name: 'Save up',
        type: 'saving',
        periodType: 'monthly',
        targetAmount: 10000,
        startDate: '2026-10-01',
        userId: alice.id,
        walletId,
      })
      .expect(201);
    goalId = goal.body.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('users', () => {
    it('cannot read another user', () =>
      api().get(`/api/v1/users/${alice.id}`).set(as(bob)).expect(403));

    it('cannot update another user', () =>
      api()
        .patch(`/api/v1/users/${alice.id}`)
        .set(as(bob))
        .send({ username: 'hacked', email: 'hacked@example.com' })
        .expect(403));

    it('cannot change another user’s password', () =>
      api()
        .patch(`/api/v1/users/${alice.id}/update-password`)
        .set(as(bob))
        .send({
          id: alice.id,
          username: 'alice',
          email: 'alice@example.com',
          oldPassword: 'x',
          newPassword: 'y',
        })
        .expect(403));

    it('cannot reorder another user’s categories', () =>
      api()
        .patch(`/api/v1/users/${alice.id}/category-order`)
        .set(as(bob))
        .send({ id: alice.id, categoryOrder: [] })
        .expect(403));

    it('cannot redirect a category-order write via the body id', async () => {
      const before = await api()
        .get(`/api/v1/users/${alice.id}`)
        .set(as(alice))
        .expect(200);

      await api()
        .patch(`/api/v1/users/${bob.id}/category-order`)
        .set(as(bob))
        .send({ id: alice.id, categoryOrder: [] })
        .expect(200);

      const after = await api()
        .get(`/api/v1/users/${alice.id}`)
        .set(as(alice))
        .expect(200);
      expect(after.body.categoryOrder).toEqual(before.body.categoryOrder);
    });

    it('can still read and update yourself', async () => {
      await api().get(`/api/v1/users/${bob.id}`).set(as(bob)).expect(200);
      await api()
        .patch(`/api/v1/users/${bob.id}`)
        .set(as(bob))
        .send({ username: 'bob', email: 'bob@example.com' })
        .expect(200);
    });
  });

  describe('wallets', () => {
    it('cannot list another user’s wallets', () =>
      api().get(`/api/v1/wallets/user/${alice.id}`).set(as(bob)).expect(401));

    it('cannot update another user’s wallet', () =>
      api()
        .patch(`/api/v1/wallets/${walletId}`)
        .set(as(bob))
        .send({ name: 'Mine now', currency: 'LKR' })
        .expect(403));

    it('cannot delete another user’s wallet', () =>
      api().delete(`/api/v1/wallets/${walletId}`).set(as(bob)).expect(403));
  });

  describe('categories', () => {
    it('cannot read another user’s category', () =>
      api().get(`/api/v1/categories/${categoryId}`).set(as(bob)).expect(403));

    it('cannot update another user’s category', () =>
      api()
        .patch(`/api/v1/categories/${categoryId}`)
        .set(as(bob))
        .send({ name: 'Mine now', icon: 'CASH', enable: true })
        .expect(403));

    it('cannot delete another user’s category', () =>
      api()
        .delete(`/api/v1/categories/${categoryId}`)
        .set(as(bob))
        .expect(403));
  });

  describe('records', () => {
    it('cannot list another user’s wallet records', () =>
      api().get(`/api/v1/records/wallet/${walletId}`).set(as(bob)).expect(403));

    it('cannot read another user’s wallet summary', () =>
      api()
        .get(`/api/v1/records/wallet/${walletId}/summary`)
        .set(as(bob))
        .expect(403));

    it('cannot read another user’s record', () =>
      api().get(`/api/v1/records/${recordId}`).set(as(bob)).expect(403));

    it('cannot update another user’s record', () =>
      api()
        .patch(`/api/v1/records/${recordId}`)
        .set(as(bob))
        .send({ price: 1 })
        .expect(403));

    it('cannot delete another user’s record', () =>
      api().delete(`/api/v1/records/${recordId}`).set(as(bob)).expect(403));

    it('cannot add a record into another user’s wallet', () =>
      api()
        .post('/api/v1/records')
        .set(as(bob))
        .send({
          price: 1,
          date: '2026-10-01',
          wallet: { id: walletId },
          category: { id: categoryId },
        })
        .expect(403));

    it('cannot read another user’s category remarks', () =>
      api()
        .get(`/api/v1/records/category/${categoryId}/remarks`)
        .set(as(bob))
        .expect(403));
  });

  describe('goals', () => {
    it('cannot list another user’s wallet goals', () =>
      api().get(`/api/v1/goals/wallet/${walletId}`).set(as(bob)).expect(403));

    it('cannot read another user’s goal', () =>
      api().get(`/api/v1/goals/${goalId}`).set(as(bob)).expect(403));

    it('cannot update another user’s goal', () =>
      api()
        .patch(`/api/v1/goals/${goalId}`)
        .set(as(bob))
        .send({
          name: 'Mine now',
          type: 'saving',
          periodType: 'monthly',
          targetAmount: 1,
          startDate: '2026-10-01',
        })
        .expect(403));

    it('cannot delete another user’s goal', () =>
      api().delete(`/api/v1/goals/${goalId}`).set(as(bob)).expect(403));

    it('cannot create a goal on another user’s wallet', () =>
      api()
        .post('/api/v1/goals')
        .set(as(bob))
        .send({
          type: 'saving',
          periodType: 'monthly',
          targetAmount: 1,
          startDate: '2026-10-01',
          userId: bob.id,
          walletId,
        })
        .expect(403));
  });

  // The owner must still have full access - and everything Bob tried above
  // must have left Alice's data intact.
  describe('owner access is unaffected', () => {
    it('owner can still read their wallet records, record, and goal', async () => {
      const records = await api()
        .get(`/api/v1/records/wallet/${walletId}`)
        .set(as(alice))
        .expect(200);
      expect(records.body.map((r) => r.id)).toContain(recordId);

      const record = await api()
        .get(`/api/v1/records/${recordId}`)
        .set(as(alice))
        .expect(200);
      expect(Number(record.body.price)).toBe(1500);

      const goal = await api()
        .get(`/api/v1/goals/${goalId}`)
        .set(as(alice))
        .expect(200);
      expect(goal.body.name).toBe('Save up');

      const category = await api()
        .get(`/api/v1/categories/${categoryId}`)
        .set(as(alice))
        .expect(200);
      expect(category.body.name).not.toBe('Mine now');
    });

    it('owner can update and delete their own record', async () => {
      await api()
        .patch(`/api/v1/records/${recordId}`)
        .set(as(alice))
        .send({ price: 2000 })
        .expect(200);
      await api()
        .delete(`/api/v1/records/${recordId}`)
        .set(as(alice))
        .expect(200);
    });
  });
});
