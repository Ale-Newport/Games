import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: '8-Puzzle',
    'menu.subtitle':
      'Slide the eight tiles into order around a single gap. The solver always knows the shortest way.',
    'level.easy': 'Easy',
    'level.medium': 'Medium',
    'level.hard': 'Random',
    'level.easy.hint': 'Twelve random slides from solved.',
    'level.medium.hint': 'Forty random slides from solved.',
    'level.hard.hint': 'Any solvable board: up to 31 moves away.',
  },
  es: {
    title: 'Puzle de 8',
    'menu.subtitle':
      'Desliza las ocho fichas hasta ordenarlas alrededor de un solo hueco. El solucionador siempre conoce el camino más corto.',
    'level.easy': 'Fácil',
    'level.medium': 'Medio',
    'level.hard': 'Aleatorio',
    'level.easy.hint': 'Doce deslizamientos al azar desde la solución.',
    'level.medium.hint': 'Cuarenta deslizamientos al azar desde la solución.',
    'level.hard.hint': 'Cualquier tablero resoluble: hasta 31 movimientos.',
  },
};
