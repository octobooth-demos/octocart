import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore } from '../src/data/store.js';
import { testApp } from './helpers.js';

describe('products routes', () => {
  beforeEach(() => resetStore());

  it('GET /api/products lists all products', async () => {
    const res = await request(testApp()).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(Number.isInteger(res.body.products[0].price)).toBe(true);
  });

  it('filters by category and search text', async () => {
    const res = await request(testApp()).get('/api/products?category=drinkware&q=mug');
    expect(res.status).toBe(200);
    expect(res.body.products.map((p: { id: string }) => p.id)).toEqual(['contribution-graph-mug']);
  });

  it('rejects an unknown category', async () => {
    const res = await request(testApp()).get('/api/products?category=spaceships');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('GET /api/products/:id returns a product', async () => {
    const res = await request(testApp()).get('/api/products/octocat-hoodie');
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ id: 'octocat-hoodie', price: 5500 });
  });

  it('GET /api/products/:id returns 404 for unknown ids', async () => {
    const res = await request(testApp()).get('/api/products/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});

describe('app', () => {
  it('GET /api/health reports ok', async () => {
    const res = await request(testApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 413 for oversized JSON bodies', async () => {
    const res = await request(testApp())
      .post('/api/auth/login')
      .send({ email: 'mona@octocart.dev', password: 'x'.repeat(200_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('payload_too_large');
  });

  it('returns 404 JSON for unknown routes', async () => {
    const res = await request(testApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(testApp())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_json');
  });
});
