import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { mockApi, mona } from '../test/utils';
import { LoginForm } from './LoginForm';

function SignedInAs() {
  const { user } = useAuth();
  return <p>{user ? `Signed in as ${user.name}` : 'Signed out'}</p>;
}

function renderLogin() {
  render(
    <AuthProvider>
      <LoginForm />
      <SignedInAs />
    </AuthProvider>,
  );
}

describe('LoginForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('signs in with email and password', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/login': () => ({ status: 201, body: { token: 't', user: mona } }),
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Password'), 'octocat123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Signed in as Mona')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        body: JSON.stringify({ email: 'mona@octocart.dev', password: 'octocat123' }),
      }),
    );
  });

  it('shows an alert for bad credentials', async () => {
    mockApi({
      'POST /api/auth/login': () => ({
        status: 401,
        body: { error: { code: 'unauthorized', message: 'Invalid email or password' } },
      }),
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByText('Signed out')).toBeInTheDocument();
  });
});
