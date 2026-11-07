import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'X-Sudoku',
    'menu.subtitle':
      'Classic sudoku with a twist: the two shaded diagonals must also hold 1 to 9 exactly once.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.expert': 'Expert',
    'difficulty.easy.hint': '32 clues; every step is a single.',
    'difficulty.medium.hint': '22 to 28 clues; still singles only — the diagonals help.',
    'difficulty.hard.hint': 'Needs locked candidates or pairs.',
    'difficulty.expert.hint': 'Needs triples, X-Wing, Y-Wing or Swordfish.',
  },
  es: {
    title: 'Sudoku X',
    'menu.subtitle':
      'Sudoku clásico con un giro: las dos diagonales sombreadas también deben tener del 1 al 9 una sola vez.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.expert': 'Experto',
    'difficulty.easy.hint': '32 pistas; cada paso es un único.',
    'difficulty.medium.hint': 'De 22 a 28 pistas; solo únicos, y las diagonales ayudan.',
    'difficulty.hard.hint': 'Hacen falta candidatos bloqueados o pares.',
    'difficulty.expert.hint': 'Hacen falta tríos, X-Wing, Y-Wing o pez espada.',
  },
};
