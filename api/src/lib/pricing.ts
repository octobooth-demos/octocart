import { PROMO_CODES } from '../data/seed.js';
import type { CartItem, OrderLine, Product, Totals } from '../data/types.js';
import { ZERO, add, money, multiply, percentOf, subtract, sum } from './money.js';
import type { Money } from './money.js';
import { HttpError } from './errors.js';

export const FREE_SHIPPING_THRESHOLD = money(5000);
export const FLAT_SHIPPING = money(599);

export function buildLines(items: readonly CartItem[], products: ReadonlyMap<string, Product>) {
  return items.map((item): OrderLine => {
    const product = products.get(item.productId);
    if (!product) {
      throw new HttpError(409, 'product_unavailable', `Product ${item.productId} is unavailable`);
    }
    return {
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: multiply(product.price, item.quantity),
    };
  });
}

export function discountPercent(promoCode: string | undefined): number {
  if (!promoCode) return 0;
  const percent = PROMO_CODES[promoCode.toUpperCase()];
  if (percent === undefined) {
    throw new HttpError(400, 'invalid_promo_code', `Unknown promo code "${promoCode}"`);
  }
  return percent;
}

export function shippingFor(subtotalAfterDiscount: Money): Money {
  if (subtotalAfterDiscount === ZERO) return ZERO;
  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? ZERO : FLAT_SHIPPING;
}

export function calculateTotals(lines: readonly OrderLine[], percent = 0): Totals {
  const subtotal = sum(lines.map((line) => line.lineTotal));
  const discount = percentOf(subtotal, percent);
  const discounted = subtract(subtotal, discount);
  const shipping = shippingFor(discounted);
  return { subtotal, discount, shipping, total: add(discounted, shipping) };
}
