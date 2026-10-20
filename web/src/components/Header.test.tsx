import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hoodieCart, mockApi, renderWithProviders } from '../test/utils';
import { Header } from './Header';

describe('Header', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the sign-in form when signed out', () => {
    mockApi({});
    renderWithProviders(<Header />, { signedIn: false });
    expect(screen.getByRole('form', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the cart count and signs out', async () => {
    const fetchMock = mockApi({
      'GET /api/cart': () => ({ body: { cart: hoodieCart } }),
      'POST /api/auth/logout': () => ({ status: 204 }),
    });
    renderWithProviders(<Header />);

    expect(await screen.findByRole('link', { name: /^Cart\s*1\s*item$/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('form', { name: 'Sign in' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
