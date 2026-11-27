/** Length formatting in metric or imperial units, with sensible unit steps. */
export type Units = 'metric' | 'imperial';

function num(v: number, locale: string, digits = 3): string {
  const compact = Math.abs(v) >= 1e6;
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumSignificantDigits: digits,
    useGrouping: true,
  }).format(v);
}

export function formatLength(m: number, units: Units, locale: string): string {
  if (units === 'imperial') {
    const ft = m / 0.3048;
    if (ft < 1) return `${num(ft * 12, locale)} in`;
    if (ft < 5280) return `${num(ft, locale)} ft`;
    return `${num(ft / 5280, locale, 4)} mi`;
  }
  if (m < 1) return `${num(m * 100, locale)} cm`;
  if (m < 1000) return `${num(m, locale)} m`;
  return `${num(m / 1000, locale, 4)} km`;
}

/** "×2.4 too small" style ratio between a guess and the truth (always ≥ 1). */
export const ratioOf = (guess: number, actual: number) => Math.max(guess / actual, actual / guess);
