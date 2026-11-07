import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Sudoku 6×6',
    'menu.subtitle':
      'Fill the 6×6 grid so every row, column and 2×3 box holds the digits 1 to 6 exactly once.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.easy.hint': '14 clues; every step is a single.',
    'difficulty.medium.hint': '9 to 12 clues; still singles only.',
    'difficulty.hard.hint': 'Needs locked candidates, pairs, X-Wing or Y-Wing.',
  },
  es: {
    title: 'Sudoku 6×6',
    'menu.subtitle':
      'Rellena la cuadrícula de 6×6 para que cada fila, columna y región de 2×3 tenga los números del 1 al 6 una sola vez.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.easy.hint': '14 pistas; cada paso es un único.',
    'difficulty.medium.hint': 'De 9 a 12 pistas; solo únicos.',
    'difficulty.hard.hint': 'Hacen falta candidatos bloqueados, pares, X-Wing o Y-Wing.',
  },
};
