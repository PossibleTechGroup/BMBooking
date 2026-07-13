export type PaymentTypeFilter = 'all' | 'service_fee' | 'full';

export const PAYMENT_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Payment Types' },
  { value: 'service_fee', label: 'Appointment Fee only' },
  { value: 'full', label: 'Full Price' },
] as const;

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  service_fee: 'Appointment Fee only',
  full: 'Full Price',
};

export function getPaymentTypeLabel(paymentMethod?: string | null): string | null {
  if (!paymentMethod) return null;
  return PAYMENT_TYPE_LABELS[paymentMethod] ?? null;
}

export function matchesPaymentTypeFilter(
  paymentMethod: string | undefined | null,
  filter: PaymentTypeFilter,
): boolean {
  if (filter === 'all') return true;
  return paymentMethod === filter;
}
