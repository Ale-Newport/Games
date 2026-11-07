import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Classic Sudoku',
    'menu.subtitle':
      'Fill the grid so every row, column and 3×3 box holds the digits 1 to 9 exactly once.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.expert': 'Expert',
    'difficulty.easy.hint': 'Plenty of clues; every step is a single.',
    'difficulty.medium.hint': 'Fewer clues; still singles only, but harder to spot.',
    'difficulty.hard.hint': 'Needs locked candidates or pairs.',
    'difficulty.expert.hint': 'Needs triples, X-Wing, Y-Wing or Swordfish.',
  },
  es: {
    title: 'Sudoku clásico',
    'menu.subtitle':
      'Rellena la cuadrícula para que cada fila, columna y región de 3×3 tenga los números del 1 al 9 una sola vez.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.expert': 'Experto',
    'difficulty.easy.hint': 'Muchas pistas; cada paso es un único.',
    'difficulty.medium.hint': 'Menos pistas; solo únicos, pero más difíciles de ver.',
    'difficulty.hard.hint': 'Hacen falta candidatos bloqueados o pares.',
    'difficulty.expert.hint': 'Hacen falta tríos, X-Wing, Y-Wing o pez espada.',
  },
};
