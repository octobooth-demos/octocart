import { describe, expect, it } from 'vitest';
import { createToken, hashPassword, verifyPassword } from '../src/lib/passwords.js';

describe('passwords', () => {
  it('verifies the original password and rejects others', () => {
    const hash = hashPassword('octocat123');
    expect(verifyPassword('octocat123', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('uses a unique salt per hash', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });

  it('rejects malformed stored hashes', () => {
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'salt-only')).toBe(false);
    expect(verifyPassword('x', 'salt:abcd')).toBe(false);
  });

  it('creates unique url-safe tokens', () => {
    const token = createToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(createToken()).not.toBe(token);
  });
});
