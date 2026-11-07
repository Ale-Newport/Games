import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Mini Sudoku',
    'menu.subtitle':
      'A small sudoku: fill the 4×4 grid so every row, column and 2×2 box holds 1, 2, 3 and 4.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.easy.hint': '8 clues: a gentle start.',
    'difficulty.medium.hint': '6 clues.',
    'difficulty.hard.hint': 'Only 4 or 5 clues: look for the cell with one possible digit.',
  },
  es: {
    title: 'Minisudoku',
    'menu.subtitle':
      'Un sudoku pequeño: rellena la cuadrícula de 4×4 para que cada fila, columna y región de 2×2 tenga el 1, el 2, el 3 y el 4.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.easy.hint': '8 pistas: para empezar con calma.',
    'difficulty.medium.hint': '6 pistas.',
    'difficulty.hard.hint': 'Solo 4 o 5 pistas: busca la casilla en la que solo cabe un número.',
  },
};
