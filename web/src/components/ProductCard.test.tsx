import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../api/types';
import { ProductCard } from './ProductCard';

const hoodie: Product = {
  id: 'octocat-hoodie',
  name: 'Octocat Hoodie',
  description: 'Cozy.',
  category: 'apparel',
  price: 5500,
  image: '🧥',
  imageAlt: 'Black hoodie with an Octocat on the chest',
  stock: 3,
};

describe('ProductCard', () => {
  it('renders an accessible card with a formatted price', () => {
    render(<ProductCard product={hoodie} canAdd onAdd={() => {}} />);
    expect(screen.getByRole('article', { name: 'Octocat Hoodie' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: hoodie.imageAlt })).toBeInTheDocument();
    expect(screen.getByText('$55.00')).toBeInTheDocument();
  });

  it('calls onAdd when the button is clicked', async () => {
    const onAdd = vi.fn();
    render(<ProductCard product={hoodie} canAdd onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add Octocat Hoodie to cart' }));
    expect(onAdd).toHaveBeenCalledWith(hoodie);
  });

  it('disables the button when sold out', () => {
    render(<ProductCard product={{ ...hoodie, stock: 0 }} canAdd onAdd={() => {}} />);
    const button = screen.getByRole('button', { name: 'Add Octocat Hoodie to cart' });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Sold out');
  });
});
