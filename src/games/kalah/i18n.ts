import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Kalah Mancala',
    'menu.subtitle':
      'Sow seeds around the board, land in your store for another turn, and capture across.',
    'difficulty.easy.hint': 'Looks one move ahead, sometimes at random.',
    'difficulty.medium.hint': 'Reads four moves ahead.',
    'difficulty.hard.hint': 'Deeper search for about a second.',
    'info.goal': 'Collect the most seeds in your store',
  },
  es: {
    'menu.title': 'Kalah (mancala)',
    'menu.subtitle':
      'Siembra semillas por el tablero, cae en tu almacén para repetir turno y captura enfrente.',
    'difficulty.easy.hint': 'Mira una jugada, a veces al azar.',
    'difficulty.medium.hint': 'Lee cuatro jugadas por delante.',
    'difficulty.hard.hint': 'Búsqueda más profunda durante un segundo.',
    'info.goal': 'Reúne más semillas en tu almacén',
  },
};
