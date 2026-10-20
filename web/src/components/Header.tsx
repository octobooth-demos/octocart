import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LoginForm } from './LoginForm';

export function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="site-header">
      <h1>
        <span aria-hidden="true">🐙</span> OctoCart
      </h1>
      {user ? (
        <div className="session">
          <span>Hi, {user.name}!</span>
          <a href="#cart" className="cart-link">
            Cart <span className="badge">{itemCount}</span>
            <span className="visually-hidden"> {itemCount === 1 ? 'item' : 'items'}</span>
          </a>
          <button type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      ) : (
        <LoginForm />
      )}
    </header>
  );
}
