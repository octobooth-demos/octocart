/**
 * Money is always an integer number of cents. Never use floats for currency.
 * Create values with `money()` or `fromDollars()` and combine them with the helpers below.
 */
export type Money = number & { readonly __brand: 'Money' };

export const ZERO = 0 as Money;

export function money(cents: number): Money {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Money must be an integer number of cents, got ${cents}`);
  }
  return cents as Money;
}

/** Parses a decimal string such as "12.34" without floating point math. */
export function fromDollars(amount: string): Money {
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) {
    throw new RangeError(`Invalid dollar amount: "${amount}"`);
  }
  const [, sign, whole = '0', fraction = ''] = match;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return money(sign ? -cents : cents);
}

export function add(a: Money, b: Money): Money {
  return money(a + b);
}

export function subtract(a: Money, b: Money): Money {
  return money(a - b);
}

export function multiply(amount: Money, quantity: number): Money {
  if (!Number.isInteger(quantity)) {
    throw new RangeError(`Quantity must be an integer, got ${quantity}`);
  }
  return money(amount * quantity);
}

export function sum(amounts: readonly Money[]): Money {
  return amounts.reduce(add, ZERO);
}

/** Returns `percent`% of `amount`, rounded half-up to the nearest cent. */
export function percentOf(amount: Money, percent: number): Money {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError(`Percent must be an integer between 0 and 100, got ${percent}`);
  }
  return money(Math.round((amount * percent) / 100));
}

export function formatMoney(amount: Money, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
}
