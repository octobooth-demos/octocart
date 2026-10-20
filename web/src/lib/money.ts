/** Integer cents, matching the API's `Money` type. Never store currency as a float. */
export type Money = number;

export function formatMoney(cents: Money, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}
