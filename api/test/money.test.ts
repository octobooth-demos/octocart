import { describe, expect, it } from 'vitest';
import {
  ZERO,
  add,
  formatMoney,
  fromDollars,
  money,
  multiply,
  percentOf,
  subtract,
  sum,
} from '../src/lib/money.js';

describe('money', () => {
  it('accepts integer cents', () => {
    expect(money(1999)).toBe(1999);
  });

  it('rejects fractional cents', () => {
    expect(() => money(19.99)).toThrow(RangeError);
  });

  it('parses dollar strings without float drift', () => {
    expect(fromDollars('0.1')).toBe(10);
    expect(fromDollars('19.99')).toBe(1999);
    expect(fromDollars('-5')).toBe(-500);
    expect(() => fromDollars('1.999')).toThrow(RangeError);
    expect(() => fromDollars('abc')).toThrow(RangeError);
  });

  it('adds, subtracts, multiplies, and sums', () => {
    expect(add(money(10), money(20))).toBe(30);
    expect(subtract(money(50), money(20))).toBe(30);
    expect(multiply(money(333), 3)).toBe(999);
    expect(sum([money(1), money(2), money(3)])).toBe(6);
    expect(sum([])).toBe(ZERO);
    expect(() => multiply(money(100), 1.5)).toThrow(RangeError);
  });

  it('rounds percentages half-up to whole cents', () => {
    expect(percentOf(money(1999), 10)).toBe(200);
    expect(percentOf(money(1005), 10)).toBe(101);
    expect(() => percentOf(money(100), 12.5)).toThrow(RangeError);
  });

  it('formats as USD', () => {
    expect(formatMoney(money(123456))).toBe('$1,234.56');
  });
});
