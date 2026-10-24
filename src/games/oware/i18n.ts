import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Oware',
    'menu.subtitle':
      'Sow, then capture the pits you leave with two or three seeds — first to 25 wins.',
    'difficulty.easy.hint': 'Looks one move ahead, sometimes at random.',
    'difficulty.medium.hint': 'Reads four moves ahead.',
    'difficulty.hard.hint': 'Deeper search for about a second.',
    'info.goal': 'Capture 25 seeds — and keep your opponent fed',
  },
  es: {
    'menu.title': 'Oware',
    'menu.subtitle':
      'Siembra y captura las casillas rivales que dejes con dos o tres semillas: gana quien llegue a 25.',
    'difficulty.easy.hint': 'Mira una jugada, a veces al azar.',
    'difficulty.medium.hint': 'Lee cuatro jugadas por delante.',
    'difficulty.hard.hint': 'Búsqueda más profunda durante un segundo.',
    'info.goal': 'Captura 25 semillas y no dejes sin semillas al rival',
  },
};
