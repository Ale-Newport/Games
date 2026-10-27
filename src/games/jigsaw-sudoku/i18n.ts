import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Jigsaw Sudoku',
    'menu.subtitle':
      'Sudoku with irregular regions: every row, column and coloured nine-cell shape holds 1 to 9 exactly once. New shapes every puzzle.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.expert': 'Expert',
    'difficulty.easy.hint': '36 clues; every step is a single.',
    'difficulty.medium.hint': '26 clues; still singles only.',
    'difficulty.hard.hint': 'Needs locked candidates or pairs.',
    'difficulty.expert.hint': 'Needs triples, X-Wing, Y-Wing or Swordfish.',
  },
  es: {
    title: 'Sudoku puzle',
    'menu.subtitle':
      'Sudoku con regiones irregulares: cada fila, columna y figura coloreada de nueve casillas tiene del 1 al 9 una sola vez. Figuras nuevas en cada sudoku.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.expert': 'Experto',
    'difficulty.easy.hint': '36 pistas; cada paso es un único.',
    'difficulty.medium.hint': '26 pistas; solo únicos.',
    'difficulty.hard.hint': 'Hacen falta candidatos bloqueados o pares.',
    'difficulty.expert.hint': 'Hacen falta tríos, X-Wing, Y-Wing o pez espada.',
  },
};
