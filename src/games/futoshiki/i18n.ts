import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Futoshiki',
    'menu.subtitle':
      'Fill the grid so no digit repeats in a row or column, and every < sign between two cells points to the smaller digit.',
    'difficulty.easy': '4×4',
    'difficulty.medium': '5×5',
    'difficulty.hard': '6×6',
    'difficulty.expert': '7×7',
    'difficulty.easy.hint': 'Digits 1–4 and plenty of signs.',
    'difficulty.medium.hint': 'Digits 1–5.',
    'difficulty.hard.hint': 'Digits 1–6; needs pairs or harder techniques.',
    'difficulty.expert.hint': 'Digits 1–7; needs X-Wing, Y-Wing or triples.',
    'hint.naked-single':
      '{cell} can only be {digit}: every other digit already appears in its row or column.',
  },
  es: {
    title: 'Futoshiki',
    'menu.subtitle':
      'Rellena la cuadrícula sin repetir número en fila ni columna, y que cada signo < entre dos casillas apunte al número menor.',
    'difficulty.easy': '4×4',
    'difficulty.medium': '5×5',
    'difficulty.hard': '6×6',
    'difficulty.expert': '7×7',
    'difficulty.easy.hint': 'Números del 1 al 4 y muchos signos.',
    'difficulty.medium.hint': 'Números del 1 al 5.',
    'difficulty.hard.hint': 'Números del 1 al 6; hacen falta pares o técnicas más difíciles.',
    'difficulty.expert.hint': 'Números del 1 al 7; hacen falta X-Wing, Y-Wing o tríos.',
    'hint.naked-single':
      '{cell} solo puede ser {digit}: los demás números ya están en su fila o columna.',
  },
};
