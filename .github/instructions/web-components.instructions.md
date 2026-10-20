---
applyTo: 'web/src/**/*.tsx'
---

# Web component rules

## Accessibility (WCAG 2.2 AA)

- Use semantic elements: `<button>` for actions, `<a href>` for navigation, `<form>` with a submit
  button for forms. Never attach `onClick` to a `<div>` or `<span>`.
- Every form control has a visible `<label htmlFor>` (or a `visually-hidden` label when the context
  is obvious visually). Placeholders are not labels.
- Every image has meaningful alt text: `<img alt>` or `role="img"` with `aria-label`. Decorative
  images use `alt=""` or `aria-hidden="true"`.
- Buttons whose text is ambiguous out of context (e.g. "Add to cart", "Remove") include an
  `aria-label` naming the product.
- Errors are rendered with `role="alert"`; cart updates are announced through the `aria-live`
  region driven by `CartContext.status`.
- Do not remove focus outlines; keep `:focus-visible` styles in `styles.css`.
- Sections have a heading and use `aria-labelledby` to reference it.

## Data and money

- All network calls go through `api` in `web/src/api/client.ts`. Components never call `fetch`.
- Prices are integer cents (`Money` in `web/src/lib/money.ts`). Display them only with
  `formatMoney`; never compute totals in the UI—use the totals returned by the API.

## Tests

- New components get a `*.test.tsx` next to them using Testing Library queries by role and
  accessible name (`getByRole('button', { name: ... })`), not by class or test id.
