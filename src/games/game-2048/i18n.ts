import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Merge to 2048',
    'menu.subtitle': 'Slide the tiles; two equal tiles merge into their sum. Make a 2048 tile.',
    'level.classic': '4×4',
    'level.mini': '3×3',
    'level.big': '5×5',
    'level.classic.hint': 'The classic board: reach 2048.',
    'level.mini.hint': 'A tight board: reach 256.',
    'level.big.hint': 'Room to grow: reach 4096.',
  },
  es: {
    title: 'Fusiona hasta 2048',
    'menu.subtitle':
      'Desliza las fichas; dos fichas iguales se fusionan en su suma. Consigue la ficha 2048.',
    'level.classic': '4×4',
    'level.mini': '3×3',
    'level.big': '5×5',
    'level.classic.hint': 'El tablero clásico: llega a 2048.',
    'level.mini.hint': 'Un tablero estrecho: llega a 256.',
    'level.big.hint': 'Espacio para crecer: llega a 4096.',
  },
};
