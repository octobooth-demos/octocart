import { useCart } from '../context/CartContext';
import { formatMoney } from '../lib/money';

export function Cart() {
  const { cart, loading, updateQuantity, removeItem } = useCart();

  if (loading) {
    return (
      <section aria-labelledby="cart-heading">
        <h2 id="cart-heading">Your cart</h2>
        <p aria-busy="true">Loading your cart…</p>
      </section>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <section aria-labelledby="cart-heading">
        <h2 id="cart-heading">Your cart</h2>
        <p>Your cart is empty.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="cart-heading">
      <h2 id="cart-heading">Your cart</h2>
      <table className="cart-table">
        <caption className="visually-hidden">Items in your cart</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Total</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cart.lines.map((line) => {
            const qtyId = `qty-${line.productId}`;
            return (
              <tr key={line.productId}>
                <th scope="row">{line.name}</th>
                <td>{formatMoney(line.unitPrice)}</td>
                <td>
                  <label htmlFor={qtyId} className="visually-hidden">
                    Quantity for {line.name}
                  </label>
                  <select
                    id={qtyId}
                    value={line.quantity}
                    onChange={(e) => void updateQuantity(line.productId, Number(e.target.value))}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{formatMoney(line.lineTotal)}</td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => void removeItem(line.productId)}
                    aria-label={`Remove ${line.name} from cart`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <dl className="totals">
        <dt>Subtotal</dt>
        <dd>{formatMoney(cart.subtotal)}</dd>
        <dt>Shipping</dt>
        <dd>{cart.shipping === 0 ? 'Free' : formatMoney(cart.shipping)}</dd>
        <dt>Total</dt>
        <dd>{formatMoney(cart.total)}</dd>
      </dl>
    </section>
  );
}
