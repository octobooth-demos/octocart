import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Product } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';

export function ProductList() {
  const { token } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listProducts().then(setProducts, (err: Error) => setError(err.message));
  }, []);

  if (error) return <p role="alert">Could not load products: {error}</p>;
  if (!products) return <p aria-busy="true">Loading products…</p>;

  return (
    <section aria-labelledby="products-heading">
      <h2 id="products-heading">Octocat merch</h2>
      {!token && <p className="hint">Sign in to start adding items to your cart.</p>}
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            canAdd={Boolean(token)}
            onAdd={(p) => void addItem(p.id, p.name)}
          />
        ))}
      </div>
    </section>
  );
}
