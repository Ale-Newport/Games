import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Hex 7×7',
  'menu.subtitle': 'The small board: fast, sharp games where every bridge counts.',
  'board.label': 'Hex board, 7 by 7',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'A short Monte Carlo search; often plays a random move.',
  'difficulty.medium.hint': 'Monte Carlo tree search with 6 000 random fills per move.',
  'difficulty.hard.hint': 'Monte Carlo tree search for about 1000 ms per move.',
};

const es: Dictionary = {
  'menu.title': 'Hex 7×7',
  'menu.subtitle': 'El tablero pequeño: partidas rápidas y afiladas donde cada puente cuenta.',
  'board.label': 'Tablero de hex de 7 por 7',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Una búsqueda Monte Carlo corta; a menudo juega al azar.',
  'difficulty.medium.hint':
    'Búsqueda en árbol Monte Carlo con 6 000 rellenos aleatorios por jugada.',
  'difficulty.hard.hint': 'Búsqueda en árbol Monte Carlo durante unos 1000 ms por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
