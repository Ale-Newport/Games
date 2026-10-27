import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Sudoku 16×16',
    'menu.subtitle':
      'The big one: fill the 16×16 grid so every row, column and 4×4 box holds 1–9 and A–G exactly once.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.easy.hint': 'Many clues; every step is a single.',
    'difficulty.medium.hint': 'Fewer clues; still singles only.',
    'difficulty.hard.hint': 'Needs locked candidates or pairs somewhere.',
  },
  es: {
    title: 'Sudoku 16×16',
    'menu.subtitle':
      'El grande: rellena la cuadrícula de 16×16 para que cada fila, columna y región de 4×4 tenga del 1 al 9 y de la A a la G una sola vez.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.easy.hint': 'Muchas pistas; cada paso es un único.',
    'difficulty.medium.hint': 'Menos pistas; solo únicos.',
    'difficulty.hard.hint': 'En algún momento hacen falta candidatos bloqueados o pares.',
  },
};
