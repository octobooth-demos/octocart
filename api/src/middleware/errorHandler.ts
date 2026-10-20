import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError, NotFoundError } from '../lib/errors.js';

export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
};

/**
 * The single place that turns errors into HTTP responses.
 * Routes throw `HttpError` subclasses; anything else becomes a 500.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ErrorBody = { error: { code: err.code, message: err.message } };
    if (err.details !== undefined) body.error.details = err.details;
    res.status(err.status).json(body);
    return;
  }

  if (isBodyParserError(err)) {
    res.status(400).json({ error: { code: 'invalid_json', message: 'Malformed JSON body' } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
};

function isBodyParserError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: unknown }).type === 'entity.parse.failed'
  );
}
