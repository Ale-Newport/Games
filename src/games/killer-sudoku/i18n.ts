import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Killer Sudoku',
    'menu.subtitle':
      'No given digits: each dashed cage shows the sum of its digits, which never repeat inside it. Rows, columns and boxes still hold 1–9.',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.easy.hint': 'Small cages of 2–3 cells; singles and cage combinations.',
    'difficulty.medium.hint': 'Cages of 2–4 cells; the 45 rule may help.',
    'difficulty.hard.hint': 'Cages of 3–6 cells; needs the 45 rule or harder.',
  },
  es: {
    title: 'Sudoku asesino',
    'menu.subtitle':
      'Sin números de partida: cada jaula punteada muestra la suma de sus números, que no se repiten dentro de ella. Filas, columnas y regiones siguen teniendo del 1 al 9.',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Medio',
    'difficulty.hard': 'Difícil',
    'difficulty.easy.hint': 'Jaulas pequeñas de 2–3 casillas; únicos y combinaciones de jaula.',
    'difficulty.medium.hint': 'Jaulas de 2–4 casillas; la regla del 45 puede ayudar.',
    'difficulty.hard.hint': 'Jaulas de 3–6 casillas; hace falta la regla del 45 o más.',
  },
};
