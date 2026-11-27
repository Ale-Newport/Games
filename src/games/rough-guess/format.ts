/** Values with their units for every kind of Rough Guess question. */
import type { Translator } from '../../core/i18n';
import type { Question } from './engine';

const PRICE_UNIT: Record<string, string> = {
  bbl: '/bbl',
  mt: '/t',
  kg: '/kg',
  'troy-oz': '/oz t',
  mmbtu: '/MMBtu',
};

function num(v: number, locale: string, digits = 3): string {
  const loc = locale === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(loc, {
    notation: Math.abs(v) >= 1e6 ? 'compact' : 'standard',
    maximumSignificantDigits: digits,
  }).format(v);
}

export function formatValue(
  q: Pick<Question, 'kind' | 'unit'>,
  v: number,
  locale: string,
  t: Translator,
  digits = 3,
): string {
  switch (q.kind) {
    case 'price':
      return `US$${num(v, locale, digits)}${PRICE_UNIT[q.unit ?? ''] ?? ''}`;
    case 'distance':
      return `${num(v, locale, digits)} km`;
    case 'melting':
    case 'boiling':
      // Rounded to hundredths: 10^log10(273.15) − 273.15 is 1e-14, not 0.
      return `${num(Math.round((v - 273.15) * 100) / 100 || 0, locale, 4)} °C`;
    case 'density':
      return `${num(v, locale, digits)} g/cm³`;
    case 'atomic-mass':
      return `${num(v, locale, 4)} u`;
    default:
      return `${num(v, locale, digits)} ${t(`u.short.${q.kind}`)}`;
  }
}

export const unitLabel = (q: Pick<Question, 'kind' | 'unit'>, t: Translator) =>
  q.kind === 'price' ? t(`u.price.${q.unit}`) : t(`u.${q.kind}`);
