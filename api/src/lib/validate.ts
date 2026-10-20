import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from './errors.js';

interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Validates `req.body`, `req.params`, and `req.query` with zod and replaces them
 * with the parsed values. Invalid requests become a 400 `validation_error`.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const issues: Record<string, unknown> = {};

    for (const key of ['body', 'params', 'query'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (result.success) {
        Object.defineProperty(req, key, { value: result.data, writable: true });
      } else {
        issues[key] = result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
      }
    }

    if (Object.keys(issues).length > 0) {
      next(new ValidationError(issues));
      return;
    }
    next();
  };
}
