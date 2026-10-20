import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { Cart, Order, ShippingAddress } from '../api/types';
import { useAuth } from './AuthContext';

const EMPTY_CART: Cart = { lines: [], subtotal: 0, discount: 0, shipping: 0, total: 0 };

interface CartState {
  cart: Cart;
  itemCount: number;
  /** Short status message announced to screen readers via an aria-live region. */
  status: string;
  error: string | null;
  addItem: (productId: string, name: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  checkout: (address: ShippingAddress, promoCode?: string) => Promise<Order>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [serverCart, setCart] = useState<Cart>(EMPTY_CART);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cart = token ? serverCart : EMPTY_CART;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api.getCart(token).then(
      (fetched) => !cancelled && setCart(fetched),
      (err: Error) => !cancelled && setError(err.message),
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  const run = useCallback(
    async (action: (token: string) => Promise<Cart>, message: string) => {
      if (!token) {
        setError('Please sign in first.');
        return;
      }
      setError(null);
      try {
        setCart(await action(token));
        setStatus(message);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [token],
  );

  const addItem = useCallback(
    (productId: string, name: string) =>
      run((t) => api.addToCart(t, productId), `Added ${name} to your cart.`),
    [run],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      run((t) => api.updateCartItem(t, productId, quantity), 'Cart updated.'),
    [run],
  );

  const removeItem = useCallback(
    (productId: string) => run((t) => api.removeCartItem(t, productId), 'Item removed.'),
    [run],
  );

  const checkout = useCallback(
    async (address: ShippingAddress, promoCode?: string) => {
      if (!token) throw new Error('Please sign in first.');
      const order = await api.checkout(token, address, promoCode);
      setCart(EMPTY_CART);
      setStatus('Order placed!');
      return order;
    },
    [token],
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount: cart.lines.reduce((n, line) => n + line.quantity, 0),
      status,
      error,
      addItem,
      updateQuantity,
      removeItem,
      checkout,
    }),
    [cart, status, error, addItem, updateQuantity, removeItem, checkout],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
