import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetStore } from '../src/data/store.js';
import { loginAs, testApp } from './helpers.js';

describe('cart routes', () => {
  let app: ReturnType<typeof testApp>;
  let auth: { Authorization: string };

  beforeEach(async () => {
    resetStore();
    app = testApp();
    auth = { Authorization: `Bearer ${await loginAs(app)}` };
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('GET /api/cart starts empty', async () => {
    const res = await request(app).get('/api/cart').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.cart).toMatchObject({ lines: [], subtotal: 0, total: 0 });
  });

  it('POST /api/cart/items adds and merges items', async () => {
    await request(app).post('/api/cart/items').set(auth).send({ productId: 'mona-sticker-pack' });
    const res = await request(app)
      .post('/api/cart/items')
      .set(auth)
      .send({ productId: 'mona-sticker-pack', quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.cart.lines).toEqual([
      expect.objectContaining({ productId: 'mona-sticker-pack', quantity: 3, lineTotal: 2400 }),
    ]);
    expect(res.body.cart.subtotal).toBe(2400);
  });

  it('rejects invalid quantities', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set(auth)
      .send({ productId: 'mona-sticker-pack', quantity: 0.5 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('returns 404 for unknown products', async () => {
    const res = await request(app).post('/api/cart/items').set(auth).send({ productId: 'nope' });
    expect(res.status).toBe(404);
  });

  it('returns 409 when stock is insufficient', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set(auth)
      .send({ productId: 'copilot-plushie', quantity: 9 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('conflict');
  });

  it('PATCH /api/cart/items/:productId updates quantity', async () => {
    await request(app).post('/api/cart/items').set(auth).send({ productId: 'octocat-hoodie' });
    const res = await request(app)
      .patch('/api/cart/items/octocat-hoodie')
      .set(auth)
      .send({ quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.cart.subtotal).toBe(11000);
    expect(res.body.cart.shipping).toBe(0);
  });

  it('PATCH returns 404 for items not in the cart', async () => {
    const res = await request(app)
      .patch('/api/cart/items/octocat-hoodie')
      .set(auth)
      .send({ quantity: 2 });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/cart/items/:productId removes an item', async () => {
    await request(app).post('/api/cart/items').set(auth).send({ productId: 'octocat-hoodie' });
    const res = await request(app).delete('/api/cart/items/octocat-hoodie').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.cart.lines).toEqual([]);
  });

  it('keeps carts separate per user', async () => {
    await request(app).post('/api/cart/items').set(auth).send({ productId: 'octocat-hoodie' });
    const hubot = { Authorization: `Bearer ${await loginAs(app, 'hubot@octocart.dev')}` };
    const res = await request(app).get('/api/cart').set(hubot);
    expect(res.body.cart.lines).toEqual([]);
  });
});
