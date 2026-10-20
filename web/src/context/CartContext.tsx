import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { Cart, Order, ShippingAddress } from '../api/types';
import { useAuth } from './AuthContext';

const EMPTY_CART: Cart = { lines: [], subtotal: 0, discount: 0, shipping: 0, total: 0 };

interface CartState {
  cart: Cart;
  itemCount: number;
  /** True until the signed-in user's cart has loaded. Edits are disabled meanwhile. */
  loading: boolean;
  /** Short status message announced to screen readers via an aria-live region. */
  status: string;
  error: string | null;
  addItem: (productId: string, name: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  checkout: (address: ShippingAddress, promoCode?: string) => Promise<Order>;
}

const CartContext = createContext<CartState | null>(null);

function countItems(cart: Cart): number {
  return cart.lines.reduce((n, line) => n + line.quantity, 0);
}

function describeCount(cart: Cart): string {
  const count = countItems(cart);
  return `${count} ${count === 1 ? 'item' : 'items'} in your cart.`;
}

/** Cart state is scoped to the signed-in session: it resets whenever the token changes. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  return (
    <SessionCartProvider key={token ?? 'signed-out'} token={token}>
      {children}
    </SessionCartProvider>
  );
}

function SessionCartProvider({ token, children }: { token: string | null; children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(Boolean(token));
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Only the most recently issued request may update the cart, so slow responses
  // can never overwrite newer state.
  const latestRequest = useRef(0);

  const apply = useCallback(async (request: Promise<Cart>, message: (cart: Cart) => string) => {
    const id = ++latestRequest.current;
    setError(null);
    try {
      const next = await request;
      if (id !== latestRequest.current) return;
      setCart(next);
      setStatus(message(next));
    } catch (err) {
      if (id === latestRequest.current) setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const id = ++latestRequest.current;
    api
      .getCart(token)
      .then((next) => {
        if (id === latestRequest.current) setCart(next);
      })
      .catch((err: Error) => {
        if (id === latestRequest.current) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const run = useCallback(
    async (action: (token: string) => Promise<Cart>, message: string) => {
      if (!token) {
        setError('Please sign in first.');
        return;
      }
      await apply(action(token), (next) => `${message} ${describeCount(next)}`);
    },
    [token, apply],
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
      latestRequest.current++;
      setCart(EMPTY_CART);
      setStatus(`Order placed! ${describeCount(EMPTY_CART)}`);
      return order;
    },
    [token],
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount: countItems(cart),
      loading,
      status,
      error,
      addItem,
      updateQuantity,
      removeItem,
      checkout,
    }),
    [cart, loading, status, error, addItem, updateQuantity, removeItem, checkout],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
