import request from 'supertest';
import { createApp } from '../src/app.js';
import { DEMO_PASSWORD } from '../src/data/seed.js';

export function testApp() {
  return createApp();
}

/** Logs in as a seeded demo user and returns a bearer token. */
export async function loginAs(
  app: ReturnType<typeof createApp>,
  email = 'mona@octocart.dev',
): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: DEMO_PASSWORD });
  if (res.status !== 201) throw new Error(`Login failed: ${res.status}`);
  return res.body.token as string;
}

export const validAddress = {
  name: 'Mona Lisa Octocat',
  line1: '88 Colin P Kelly Jr St',
  city: 'San Francisco',
  postalCode: '94107',
  country: 'us',
};
