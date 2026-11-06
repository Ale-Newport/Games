import type { Dictionary, Locale } from '../../core/i18n';

/** Strings layered over the shared m,n,k strings (src/games/shared/mnk/i18n.ts). */
const en: Dictionary = {
  'menu.title': 'Tic-Tac-Toe 4×4',
  'menu.subtitle':
    'Four in a row on a 4×4 grid. More room, deeper traps — and three in a row is not enough.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.perfect': 'Perfect',
  'difficulty.easy.hint': 'Blocks some threats, misses many.',
  'difficulty.medium.hint': 'Looks four moves ahead. Build two threats at once to win.',
  'difficulty.perfect.hint': 'Exact solver: it never loses and sets traps. Hold the draw.',
  'board.label': 'Tic-Tac-Toe 4×4 board',
};

const es: Dictionary = {
  'menu.title': 'Tres en raya 4×4',
  'menu.subtitle':
    'Cuatro en línea en una cuadrícula de 4×4. Más espacio, trampas más profundas: tres en línea no bastan.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.perfect': 'Perfecto',
  'difficulty.easy.hint': 'Bloquea algunas amenazas, pero se le escapan muchas.',
  'difficulty.medium.hint': 'Mira cuatro jugadas adelante. Crea dos amenazas a la vez para ganar.',
  'difficulty.perfect.hint':
    'Solucionador exacto: nunca pierde y tiende trampas. Aguanta el empate.',
  'board.label': 'Tablero de tres en raya 4×4',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
