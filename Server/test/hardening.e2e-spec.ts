import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';

import { createTestApp, signUp, authHeader, Session } from './utils/test-app';

// Production-hardening checks: security headers, request-body whitelisting,
// and rate limits on the unauthenticated auth endpoints.
describe('API hardening (e2e)', () => {
  let app: NestExpressApplication;
  let carol: Session;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    carol = await signUp(app, 'carol');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('sends security headers and hides the framework', async () => {
    const res = await api()
      .get('/api/v1/categories')
      .set(authHeader(carol))
      .expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('still accepts every field a password change needs (whitelist)', async () => {
    await api()
      .patch(`/api/v1/users/${carol.id}/update-password`)
      .set(authHeader(carol))
      .send({
        id: carol.id,
        username: 'carol',
        email: 'carol@example.com',
        oldPassword: 'Password123!',
        newPassword: 'NewPassword456!',
      })
      .expect(200);

    await api()
      .post('/api/v1/auth/login')
      .send({ username: 'carol', password: 'NewPassword456!' })
      .expect(201);
  });

  it('drops body fields a DTO does not declare (whitelist)', async () => {
    const res = await api()
      .post('/api/v1/records')
      .set(authHeader(carol))
      .send({ unexpected: 'field' })
      .expect(400);

    // Rejected on the declared fields only; the unknown one never reaches
    // validation errors because it was stripped.
    expect(JSON.stringify(res.body.message)).not.toContain('unexpected');
  });

  it('rate-limits login attempts (10 per minute per IP)', async () => {
    // signUp + the password test above already used 2 of the 10 attempts.
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) {
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ username: 'carol', password: 'wrong-password' });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 8)).toEqual(Array(8).fill(401));
    expect(statuses[8]).toBe(429);
  });

  it('rate-limits sign-ups (5 per minute per IP)', async () => {
    // signUp('carol') already used 1 of the 5.
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await api()
        .post('/api/v1/users')
        .send({
          username: `spam${i}`,
          email: `spam${i}@example.com`,
          password: 'Password123!',
        });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 4)).toEqual(Array(4).fill(201));
    expect(statuses[4]).toBe(429);
  });
});
