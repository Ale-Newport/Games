import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: '15-Puzzle',
    'menu.subtitle':
      'Slide fifteen tiles into order around a single gap on a 4×4 board — the classic sliding puzzle.',
    'level.easy': 'Easy',
    'level.medium': 'Medium',
    'level.hard': 'Random',
    'level.easy.hint': 'Thirty random slides from solved.',
    'level.medium.hint': 'Seventy random slides from solved.',
    'level.hard.hint': 'Any solvable board: around fifty moves at best.',
  },
  es: {
    title: 'Puzle de 15',
    'menu.subtitle':
      'Desliza quince fichas hasta ordenarlas alrededor de un solo hueco en un tablero de 4×4: el clásico puzle deslizante.',
    'level.easy': 'Fácil',
    'level.medium': 'Medio',
    'level.hard': 'Aleatorio',
    'level.easy.hint': 'Treinta deslizamientos al azar desde la solución.',
    'level.medium.hint': 'Setenta deslizamientos al azar desde la solución.',
    'level.hard.hint': 'Cualquier tablero resoluble: unos cincuenta movimientos como mínimo.',
  },
};
