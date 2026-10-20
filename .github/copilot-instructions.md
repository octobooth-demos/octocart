# OctoCart – Copilot instructions

OctoCart is a small Octocat merch store: an Express + TypeScript API (`api/`) and a React + Vite
frontend (`web/`) in an npm workspaces monorepo. It is used to demo Copilot Code Review, so keep
changes small, readable, and consistent with the house rules below.

## House rules (apply to every change)

1. **Money is integer cents.** All prices and totals use the `Money` type from
   `api/src/lib/money.ts` and its helpers (`money`, `fromDollars`, `add`, `subtract`, `multiply`,
   `sum`, `percentOf`). Never use floats, `parseFloat`, `toFixed`, or `* 100` / `/ 100` to do
   currency math. The only place cents are divided by 100 is `formatMoney`.
2. **Every API input is validated with zod.** Routes use the `validate({ body, params, query })`
   middleware from `api/src/lib/validate.ts` with a schema exported from `api/src/schemas.ts`.
   Never read `req.body`, `req.params`, or `req.query` without validating it first.
3. **Errors go through the error middleware.** Async handlers are wrapped in `asyncHandler`
   (`api/src/lib/asyncHandler.ts`) and signal failures by throwing an `HttpError` subclass from
   `api/src/lib/errors.ts`. Only `errorHandler` (`api/src/middleware/errorHandler.ts`) writes error
   responses; the shape is always `{ error: { code, message, details? } }`.
4. **Authenticated routes use `requireAuth`** and read the user with `currentUser(req)`. Users may
   only read or modify their own cart and orders.
5. **Every new or changed route has a test** in `api/test/<router>.test.ts` covering the happy path
   and at least one error path (validation, auth, or not found).
6. **The web app is accessible.** See `.github/instructions/web-components.instructions.md`.
7. **No secrets or credentials in code**, and never log tokens or password hashes.

## Commands

```bash
npm install
npm run lint       # ESLint (typescript-eslint, react-hooks, jsx-a11y)
npm run typecheck  # tsc in both workspaces
npm test           # vitest in both workspaces
npm run build
npm run dev        # API on :3001, web on :5173
```

## Review priorities

When reviewing pull requests, flag violations of the house rules above first (they are bugs in this
codebase, not style nits), then correctness and security issues, then everything else.
