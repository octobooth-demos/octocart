# 🐙 OctoCart

OctoCart is a tiny Octocat merch store. It's a **template repository** for showing off
[Copilot Code Review](https://docs.github.com/copilot/using-github-copilot/code-review/using-copilot-code-review).

This repo is the clean baseline. The
[`octobooth-demos/repo-setup-scripts`](https://github.com/octobooth-demos/repo-setup-scripts)
copy it into demo accounts, then open seeded pull requests that quietly break the house rules
below. Copilot Code Review then catches those violations, guided by the custom instructions in
[`.github/`](.github).

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/octobooth-demos/octocart)

## Quick start

```bash
npm install
npm run dev        # API → http://localhost:3001, web → http://localhost:5173
```

Sign in as `mona@octocart.dev` or `hubot@octocart.dev`. The password for both is `octocat123`. Try the
promo codes `OCTO10` and `HUBBER20`.

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run lint`      | ESLint (typescript-eslint, react-hooks, a11y) |
| `npm run typecheck` | `tsc --noEmit` in both workspaces             |
| `npm test`          | vitest in both workspaces                     |
| `npm run build`     | Compiles the API and builds the web app       |
| `npm run format`    | Prettier                                      |

## Architecture

```
api/                     Express + TypeScript, in-memory data
  src/app.ts             createApp(): mounts routers + errorHandler
  src/schemas.ts         zod schemas for every request
  src/lib/money.ts       Money (integer cents) + helpers
  src/lib/pricing.ts     buildLines, calculateTotals, discountPercent, shipping
  src/lib/validate.ts    validate({ body, params, query }) middleware
  src/lib/asyncHandler.ts
  src/lib/errors.ts      HttpError, ValidationError, NotFoundError, …
  src/middleware/        errorHandler, notFoundHandler, requireAuth
  src/routes/            products, auth, cart, orders
  src/data/              store (async, in-memory), seed data
  test/                  one vitest + supertest file per router/helper
web/                     React + Vite + TypeScript
  src/api/client.ts      typed API client (the only place that calls fetch)
  src/context/           AuthContext, CartContext
  src/components/        Header, LoginForm, ProductList, ProductCard, Cart, CheckoutForm
```

### API

| Method | Path                             | Auth | Notes                             |
| ------ | -------------------------------- | ---- | --------------------------------- |
| GET    | `/api/products`                  |      | `?category=` and `?q=`            |
| GET    | `/api/products/:id`              |      |                                   |
| POST   | `/api/auth/login`                |      | returns `{ token, user }`         |
| GET    | `/api/auth/me`                   | ✅   |                                   |
| POST   | `/api/auth/logout`               | ✅   |                                   |
| GET    | `/api/cart`                      | ✅   | lines + totals                    |
| POST   | `/api/cart/items`                | ✅   | `{ productId, quantity? }`        |
| PATCH  | `/api/cart/items/:productId`     | ✅   | `{ quantity }`                    |
| DELETE | `/api/cart/items/:productId`     | ✅   |                                   |
| POST   | `/api/orders`                    | ✅   | `{ shippingAddress, promoCode? }` |
| GET    | `/api/orders`, `/api/orders/:id` | ✅   |                                   |

## House rules

These rules are spelled out in [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
and the path-scoped files in [`.github/instructions/`](.github/instructions), so Copilot Code
Review enforces them:

1. Money is integer cents, and all currency math goes through the `Money` helpers.
2. Every request is validated with zod through `validate()`.
3. Async handlers use `asyncHandler`, and failures throw `HttpError`s handled by `errorHandler`.
4. Authenticated routes use `requireAuth` and are scoped to `currentUser(req)`.
5. Every route has tests.
6. Web components are accessible and use the API client and `formatMoney`.
