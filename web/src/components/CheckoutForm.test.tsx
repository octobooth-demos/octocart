import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Order } from '../api/types';
import { useCart } from '../context/CartContext';
import { hoodieCart, mockApi, renderWithProviders } from '../test/utils';
import { CheckoutForm } from './CheckoutForm';

const order: Order = {
  id: '3f2b7c1e-0000-4000-8000-000000000000',
  lines: hoodieCart.lines,
  subtotal: 5500,
  discount: 550,
  shipping: 599,
  total: 5549,
  promoCode: 'OCTO10',
  shippingAddress: {
    name: 'Mona',
    line1: '88 Colin P Kelly Jr St',
    city: 'San Francisco',
    postalCode: '94107',
    country: 'US',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
};

function AddHoodie() {
  const { addItem } = useCart();
  return (
    <button type="button" onClick={() => void addItem('octocat-hoodie', 'Octocat Hoodie')}>
      Add hoodie
    </button>
  );
}

async function fillAddress() {
  await userEvent.type(await screen.findByLabelText('Full name'), 'Mona');
  await userEvent.type(screen.getByLabelText('Street address'), '88 Colin P Kelly Jr St');
  await userEvent.type(screen.getByLabelText('City'), 'San Francisco');
  await userEvent.type(screen.getByLabelText('Postal code'), '94107');
}

describe('CheckoutForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('places an order and shows the API totals', async () => {
    mockApi({
      'GET /api/cart': () => ({ body: { cart: hoodieCart } }),
      'POST /api/orders': () => ({ body: { order } }),
    });
    renderWithProviders(<CheckoutForm />);

    await fillAddress();
    await userEvent.type(screen.getByLabelText('Promo code (optional)'), 'OCTO10');
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));

    expect(
      await screen.findByRole('heading', { name: /Thanks for your order/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('$55.49')).toBeInTheDocument();
    expect(screen.getByText('−$5.50')).toBeInTheDocument();
  });

  it('disables the button while submitting', async () => {
    let finish: () => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return new Promise<Response>((resolve) => {
            finish = () => resolve(new Response(JSON.stringify({ order }), { status: 201 }));
          });
        }
        return Promise.resolve(new Response(JSON.stringify({ cart: hoodieCart })));
      }),
    );
    renderWithProviders(<CheckoutForm />);
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    expect(screen.getByRole('button', { name: 'Placing order…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('heading', { name: /Thanks/ })).toBeInTheDocument();
  });

  it('shows API errors as an alert', async () => {
    mockApi({
      'GET /api/cart': () => ({ body: { cart: hoodieCart } }),
      'POST /api/orders': () => ({
        status: 400,
        body: { error: { code: 'invalid_promo_code', message: 'Unknown promo code "NOPE"' } },
      }),
    });
    renderWithProviders(<CheckoutForm />);
    await fillAddress();
    await userEvent.type(screen.getByLabelText('Promo code (optional)'), 'NOPE');
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown promo code "NOPE"');
  });

  it('returns to the form when shopping resumes after an order', async () => {
    mockApi({
      'GET /api/cart': () => ({ body: { cart: hoodieCart } }),
      'POST /api/orders': () => ({ status: 201, body: { order } }),
      'POST /api/cart/items': () => ({ status: 201, body: { cart: hoodieCart } }),
    });
    renderWithProviders(
      <>
        <AddHoodie />
        <CheckoutForm />
      </>,
    );
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
    await screen.findByRole('heading', { name: /Thanks/ });

    await userEvent.click(screen.getByRole('button', { name: 'Add hoodie' }));
    expect(await screen.findByRole('button', { name: 'Place order' })).toBeEnabled();
  });
});
