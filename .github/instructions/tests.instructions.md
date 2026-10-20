---
applyTo: '**/*.test.ts,**/*.test.tsx'
---

# Test rules

- Use vitest (`describe`, `it`, `expect`). No `.only` or `.skip` in committed tests.
- API route tests use supertest against `createApp()` (via `testApp()` in `api/test/helpers.ts`)
  and call `resetStore()` in `beforeEach` so tests never share state.
- Use `loginAs(app)` from `api/test/helpers.ts` for authenticated requests instead of hard-coding
  tokens.
- Web tests stub the network with `mockApi({ 'GET /api/cart': ... })` and render with
  `renderWithProviders()` from `web/src/test/utils.tsx`; never call the real API.
- Each route test covers the happy path plus at least one error path, and asserts both the status
  code and `res.body.error.code` for errors.
- Assert money values as integer cents (e.g. `expect(total).toBe(5549)`), never with
  `toBeCloseTo`.
