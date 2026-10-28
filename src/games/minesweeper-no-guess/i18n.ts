import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'No-Guess Minesweeper',
    'menu.subtitle':
      'Minesweeper where every board can be cleared by reasoning from the first cell: no luck needed, ever.',
    'hint.guess': 'Every cell left can be decided by reasoning; look at the numbers again.',
  },
  es: {
    title: 'Buscaminas sin adivinar',
    'menu.subtitle':
      'Buscaminas en el que cada tablero se despeja razonando desde la primera casilla: nunca hace falta suerte.',
    'hint.guess': 'Todo lo que queda se puede decidir razonando; vuelve a mirar los números.',
  },
};
