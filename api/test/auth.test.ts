import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '../src/data/seed.js';
import { resetStore } from '../src/data/store.js';
import { loginAs, testApp } from './helpers.js';

describe('auth routes', () => {
  beforeEach(() => resetStore());

  it('POST /api/auth/login returns a token for valid credentials', async () => {
    const res = await request(testApp())
      .post('/api/auth/login')
      .send({ email: 'MONA@octocart.dev', password: DEMO_PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: 'user-mona',
      email: 'mona@octocart.dev',
      name: 'Mona Lisa Octocat',
    });
  });

  it('rejects a wrong password', async () => {
    const res = await request(testApp())
      .post('/api/auth/login')
      .send({ email: 'mona@octocart.dev', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('rejects an invalid body', async () => {
    const res = await request(testApp()).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('GET /api/auth/me requires a token', async () => {
    const res = await request(testApp()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns the current user', async () => {
    const app = testApp();
    const token = await loginAs(app);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('mona@octocart.dev');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/logout requires a token', async () => {
    const res = await request(testApp()).post('/api/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('POST /api/auth/logout invalidates the token', async () => {
    const app = testApp();
    const token = await loginAs(app);
    const auth = { Authorization: `Bearer ${token}` };
    expect((await request(app).post('/api/auth/logout').set(auth)).status).toBe(204);
    expect((await request(app).get('/api/auth/me').set(auth)).status).toBe(401);
  });
});
