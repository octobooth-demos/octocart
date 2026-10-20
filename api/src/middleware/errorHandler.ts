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

  const parserError = BODY_PARSER_ERRORS.get(bodyParserErrorType(err));
  if (parserError) {
    res.status(parserError.status).json({ error: parserError.error });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
};

const BODY_PARSER_ERRORS = new Map<string, { status: number } & ErrorBody>([
  [
    'entity.parse.failed',
    { status: 400, error: { code: 'invalid_json', message: 'Malformed JSON body' } },
  ],
  [
    'entity.too.large',
    { status: 413, error: { code: 'payload_too_large', message: 'Request body is too large' } },
  ],
]);

function bodyParserErrorType(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const { type } = err as { type: unknown };
    if (typeof type === 'string') return type;
  }
  return '';
}
