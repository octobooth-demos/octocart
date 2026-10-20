import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats integer cents as dollars', () => {
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(1999)).toBe('$19.99');
    expect(formatMoney(123456)).toBe('$1,234.56');
  });
});
