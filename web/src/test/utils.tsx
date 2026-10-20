import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import type { Cart, User } from '../api/types';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export const mona: User = { id: 'user-mona', email: 'mona@octocart.dev', name: 'Mona' };

export const emptyCart: Cart = { lines: [], subtotal: 0, discount: 0, shipping: 0, total: 0 };

export const hoodieCart: Cart = {
  lines: [
    {
      productId: 'octocat-hoodie',
      name: 'Octocat Hoodie',
      unitPrice: 5500,
      quantity: 1,
      lineTotal: 5500,
    },
  ],
  subtotal: 5500,
  discount: 0,
  shipping: 0,
  total: 5500,
};

type Handler = (body: unknown) => { status?: number; body?: unknown };

/**
 * Stubs `fetch` with handlers keyed by "METHOD /api/path". Unmatched requests return 404.
 * Returns the mock so tests can assert on calls.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const handler = routes[key];
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const result = handler
      ? handler(body)
      : { status: 404, body: { error: { code: 'not_found', message: key } } };
    const status = result.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(result.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function renderWithProviders(ui: ReactElement, { signedIn = true } = {}) {
  return render(
    <AuthProvider initialSession={signedIn ? { token: 'test-token', user: mona } : undefined}>
      <CartProvider>{ui}</CartProvider>
    </AuthProvider>,
  );
}
