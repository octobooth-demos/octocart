import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { emptyCart, hoodieCart, mockApi, renderWithProviders } from './test/utils';

const sticker = {
  id: 'mona-sticker-pack',
  name: 'Mona Sticker Pack',
  description: 'Stickers!',
  category: 'stickers',
  price: 800,
  image: '🐙',
  imageAlt: 'Assorted Octocat stickers',
  stock: 10,
};

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('hides the cart when signed out', async () => {
    mockApi({ 'GET /api/products': () => ({ body: { products: [sticker] } }) });
    renderWithProviders(<App />, { signedIn: false });
    expect(await screen.findByText('Sign in to start adding items to your cart.')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Your cart' })).not.toBeInTheDocument();
  });

  it('announces cart changes, including repeated ones, in the live region', async () => {
    let count = 0;
    mockApi({
      'GET /api/products': () => ({ body: { products: [sticker] } }),
      'GET /api/cart': () => ({ body: { cart: emptyCart } }),
      'POST /api/cart/items': () => {
        count++;
        return {
          status: 201,
          body: { cart: { ...hoodieCart, lines: [{ ...hoodieCart.lines[0]!, quantity: count }] } },
        };
      },
    });
    const { container } = renderWithProviders(<App />);
    const add = await screen.findByRole('button', { name: 'Add Mona Sticker Pack to cart' });
    await vi.waitFor(() => expect(add).toBeEnabled());
    const live = container.querySelector('[aria-live="polite"]');

    await userEvent.click(add);
    await vi.waitFor(() => expect(live).toHaveTextContent('1 item in your cart.'));
    await userEvent.click(add);
    await vi.waitFor(() => expect(live).toHaveTextContent('2 items in your cart.'));
  });

  it('shows cart errors as an alert', async () => {
    mockApi({
      'GET /api/products': () => ({ body: { products: [sticker] } }),
      'GET /api/cart': () => ({ body: { cart: emptyCart } }),
      'POST /api/cart/items': () => ({
        status: 409,
        body: { error: { code: 'conflict', message: 'Only 0 left in stock' } },
      }),
    });
    renderWithProviders(<App />);
    const add = await screen.findByRole('button', { name: 'Add Mona Sticker Pack to cart' });
    await vi.waitFor(() => expect(add).toBeEnabled());
    await userEvent.click(add);
    expect(await screen.findByRole('alert')).toHaveTextContent('Only 0 left in stock');
  });
});
