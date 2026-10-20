import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cart } from '../api/types';
import { emptyCart, hoodieCart, mona } from '../test/utils';
import { AuthProvider } from './AuthContext';
import { CartProvider, useCart } from './CartContext';

function cartWith(quantity: number): Cart {
  return { ...hoodieCart, lines: [{ ...hoodieCart.lines[0]!, quantity }] };
}

function Probe() {
  const { cart, loading, updateQuantity } = useCart();
  return (
    <>
      <p>{loading ? 'loading' : `quantity ${cart.lines[0]?.quantity ?? 0}`}</p>
      <button type="button" onClick={() => void updateQuantity('octocat-hoodie', 2)}>
        Set 2
      </button>
      <button type="button" onClick={() => void updateQuantity('octocat-hoodie', 3)}>
        Set 3
      </button>
    </>
  );
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

describe('CartContext', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('ignores responses that arrive after a newer request', async () => {
    const pending: ((r: Response) => void)[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) =>
        init?.method === 'PATCH'
          ? new Promise<Response>((resolve) => pending.push(resolve))
          : Promise.resolve(json({ cart: cartWith(1) })),
      ),
    );
    render(
      <AuthProvider initialSession={{ token: 't', user: mona }}>
        <CartProvider>
          <Probe />
        </CartProvider>
      </AuthProvider>,
    );
    expect(await screen.findByText('quantity 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Set 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Set 3' }));
    await act(async () => pending[1]!(json({ cart: cartWith(3) })));
    await act(async () => pending[0]!(json({ cart: cartWith(2) })));

    expect(screen.getByText('quantity 3')).toBeInTheDocument();
  });

  it('starts empty for a signed-out visitor', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(
      <AuthProvider>
        <CartProvider>
          <Probe />
        </CartProvider>
      </AuthProvider>,
    );
    expect(screen.getByText(`quantity ${emptyCart.lines.length}`)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
