import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { asyncHandler } from '../src/lib/asyncHandler.js';

const req = {} as Request;
const res = {} as Response;

describe('asyncHandler', () => {
  it('forwards rejected promises to next', async () => {
    const error = new Error('boom');
    const next = vi.fn() as unknown as NextFunction;
    asyncHandler(async () => {
      throw error;
    })(req, res, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });

  it('does not call next with an error when the handler resolves', async () => {
    const next = vi.fn() as unknown as NextFunction;
    const handler = vi.fn(async () => {});
    asyncHandler(handler)(req, res, next);
    await vi.waitFor(() => expect(handler).toHaveBeenCalledWith(req, res, next));
    expect(next).not.toHaveBeenCalled();
  });
});
