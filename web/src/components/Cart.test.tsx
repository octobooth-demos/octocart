import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyCart, hoodieCart, mockApi, renderWithProviders } from '../test/utils';
import { Cart } from './Cart';

describe('Cart', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows an empty state', async () => {
    mockApi({ 'GET /api/cart': () => ({ body: { cart: emptyCart } }) });
    renderWithProviders(<Cart />);
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('lists lines and API totals', async () => {
    mockApi({ 'GET /api/cart': () => ({ body: { cart: hoodieCart } }) });
    renderWithProviders(<Cart />);
    const row = await screen.findByRole('row', { name: /Octocat Hoodie/ });
    expect(within(row).getAllByText('$55.00')).toHaveLength(2);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('updates quantity and removes items', async () => {
    const twoHoodies = {
      ...hoodieCart,
      lines: [{ ...hoodieCart.lines[0]!, quantity: 2, lineTotal: 11000 }],
      subtotal: 11000,
      total: 11000,
    };
    const fetchMock = mockApi({
      'GET /api/cart': () => ({ body: { cart: hoodieCart } }),
      'PATCH /api/cart/items/octocat-hoodie': () => ({ body: { cart: twoHoodies } }),
      'DELETE /api/cart/items/octocat-hoodie': () => ({ body: { cart: emptyCart } }),
    });
    renderWithProviders(<Cart />);

    await userEvent.selectOptions(await screen.findByLabelText('Quantity for Octocat Hoodie'), '2');
    expect(await screen.findAllByText('$110.00')).not.toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/cart/items/octocat-hoodie',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ quantity: 2 }) }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove Octocat Hoodie from cart' }));
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
  });
});
