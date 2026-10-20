export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends HttpError {
  constructor(details: unknown) {
    super(400, 'validation_error', 'Request validation failed', details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super(401, 'unauthorized', message);
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string) {
    super(404, 'not_found', `${resource} not found`);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, 'conflict', message);
  }
}
