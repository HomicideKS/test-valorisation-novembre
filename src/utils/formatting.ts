import type { Currency } from '../types';

export function formatCurrency(value: number | null, currency: Currency): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(value / 100);
}