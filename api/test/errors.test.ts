import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../src/lib/errors.js';

describe('errors', () => {
  it('preserves status, code, message, and details', () => {
    const error = new HttpError(418, 'teapot', 'I am a teapot', { brew: 'tea' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      status: 418,
      code: 'teapot',
      message: 'I am a teapot',
      details: { brew: 'tea' },
      name: 'HttpError',
    });
  });

  it.each([
    [new ValidationError({ body: [] }), 400, 'validation_error'],
    [new UnauthorizedError(), 401, 'unauthorized'],
    [new NotFoundError('Product'), 404, 'not_found'],
    [new ConflictError('Out of stock'), 409, 'conflict'],
  ])('%s maps to %i %s', (error, status, code) => {
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
  });

  it('builds readable messages', () => {
    expect(new NotFoundError('Product').message).toBe('Product not found');
    expect(new ValidationError({ body: [] }).details).toEqual({ body: [] });
  });
});
