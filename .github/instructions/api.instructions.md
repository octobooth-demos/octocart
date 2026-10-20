---
applyTo: 'api/src/**/*.ts'
---

# API rules

## Routes (`api/src/routes/*.ts`)

- Each router file exports one `Router` (for example `cartRouter`) mounted in `api/src/app.ts`.
- Every route that accepts input uses `validate({ body?, params?, query? })` with zod schemas
  defined in `api/src/schemas.ts`. Export both the schema and its inferred type under the same
  name, then read the parsed value with a cast: `const { id } = req.params as ProductIdParams;`.
- Every `async` handler is wrapped in `asyncHandler(...)`. Do not write `try/catch` blocks that send
  responses; let errors propagate.
- Signal failures by throwing `HttpError` or a subclass (`ValidationError`, `UnauthorizedError`,
  `NotFoundError`, `ConflictError`). Never call `res.status(4xx|5xx).json(...)` from a route.
- Routes that touch a user's cart or orders use `requireAuth` and scope every lookup to
  `currentUser(req).id`.
- Use `201` for creates, `204` for empty responses. Response bodies wrap data in a named key, e.g.
  `{ product }`, `{ products }`, `{ cart }`, `{ order }`.
- Access data only through the async `store` in `api/src/data/store.ts`; always `await` it.

## Money

- Use `Money` and the helpers in `api/src/lib/money.ts` for every price, line total, discount, and
  total. Pricing logic belongs in `api/src/lib/pricing.ts`.
- Forbidden for currency: floating point literals (e.g. `19.99`), `parseFloat`, `Number(x) * 100`,
  `toFixed`, and `Math.round` outside `money.ts`.
- Percent discounts are whole numbers and go through `percentOf`.

## Tests

- Every new or changed route needs tests in `api/test/<router>.test.ts`; new helpers in `lib/`
  need unit tests in `api/test/<helper>.test.ts`.
