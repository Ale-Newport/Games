import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Calcudoku',
    'menu.subtitle':
      'Fill the grid so no digit repeats in a row or column, and every cage hits its target with its operation: + − × ÷.',
    'difficulty.easy': '4×4',
    'difficulty.medium': '5×5',
    'difficulty.hard': '6×6',
    'difficulty.expert': '7×7',
    'difficulty.easy.hint': 'Digits 1–4: a first arithmetic puzzle.',
    'difficulty.medium.hint': 'Digits 1–5, cages of two or three cells.',
    'difficulty.hard.hint': 'Digits 1–6, cages of up to four cells.',
    'difficulty.expert.hint': 'Digits 1–7; needs pairs or harder techniques.',
    'hint.naked-single':
      '{cell} can only be {digit}: every other digit already appears in its row or column.',
  },
  es: {
    title: 'Calcudoku',
    'menu.subtitle':
      'Rellena la cuadrícula sin repetir número en fila ni columna, y que cada jaula dé su resultado con su operación: + − × ÷.',
    'difficulty.easy': '4×4',
    'difficulty.medium': '5×5',
    'difficulty.hard': '6×6',
    'difficulty.expert': '7×7',
    'difficulty.easy.hint': 'Números del 1 al 4: un primer puzle de cuentas.',
    'difficulty.medium.hint': 'Números del 1 al 5, jaulas de dos o tres casillas.',
    'difficulty.hard.hint': 'Números del 1 al 6, jaulas de hasta cuatro casillas.',
    'difficulty.expert.hint': 'Números del 1 al 7; hacen falta pares o técnicas más difíciles.',
    'hint.naked-single':
      '{cell} solo puede ser {digit}: los demás números ya están en su fila o columna.',
  },
};
