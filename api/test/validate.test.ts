import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ValidationError } from '../src/lib/errors.js';
import { validate } from '../src/lib/validate.js';

function run(middleware: ReturnType<typeof validate>, req: Partial<Request>) {
  const next = vi.fn();
  middleware(req as Request, {} as Response, next as unknown as NextFunction);
  return next;
}

describe('validate', () => {
  it('replaces request fields with parsed values', () => {
    const req: Partial<Request> = { body: { quantity: 2, extra: true }, query: { q: '  mug ' } };
    const next = run(
      validate({
        body: z.object({ quantity: z.number() }),
        query: z.object({ q: z.string().trim() }),
      }),
      req,
    );
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ quantity: 2 });
    expect(req.query).toEqual({ q: 'mug' });
  });

  it('reports failures for every invalid part at once', () => {
    const next = run(
      validate({
        body: z.object({ quantity: z.number() }),
        params: z.object({ id: z.string().uuid() }),
      }),
      { body: {}, params: { id: 'nope' } },
    );
    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.details).toEqual({
      body: [expect.objectContaining({ path: 'quantity' })],
      params: [expect.objectContaining({ path: 'id' })],
    });
  });
});
