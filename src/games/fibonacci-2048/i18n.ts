import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Fibonacci Merge',
    'menu.subtitle':
      'Slide the tiles; two neighbours in the Fibonacci sequence (1+1, 1+2, 2+3, 3+5…) merge into the next. Make 2584.',
    'level.classic': '4×4',
    'level.mini': '3×3',
    'level.big': '5×5',
    'level.classic.hint': 'The classic board: reach 2584.',
    'level.mini.hint': 'A tight board: reach 144.',
    'level.big.hint': 'Room to grow: reach 4181.',
    select:
      'Swipe or use the arrow keys: every tile slides that way and Fibonacci neighbours merge.',
  },
  es: {
    title: 'Fusión de Fibonacci',
    'menu.subtitle':
      'Desliza las fichas; dos vecinas de la sucesión de Fibonacci (1+1, 1+2, 2+3, 3+5…) se fusionan en la siguiente. Consigue 2584.',
    'level.classic': '4×4',
    'level.mini': '3×3',
    'level.big': '5×5',
    'level.classic.hint': 'El tablero clásico: llega a 2584.',
    'level.mini.hint': 'Un tablero estrecho: llega a 144.',
    'level.big.hint': 'Espacio para crecer: llega a 4181.',
    select:
      'Desliza o usa las flechas: todas las fichas se mueven en esa dirección y las vecinas de Fibonacci se fusionan.',
  },
};
