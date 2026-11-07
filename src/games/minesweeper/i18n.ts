import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Minesweeper',
    'menu.subtitle':
      'Open every safe cell; the numbers count the mines next to them. The first cell is always safe.',
  },
  es: {
    title: 'Buscaminas',
    'menu.subtitle':
      'Abre todas las casillas seguras; los números cuentan las minas que tienen al lado. La primera casilla siempre es segura.',
  },
};
