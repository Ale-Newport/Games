import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Hex 11×11',
  'menu.subtitle': 'The classic board: ladders, bridges and long-distance connections.',
  'board.label': 'Hex board, 11 by 11',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'A short Monte Carlo search; often plays a random move.',
  'difficulty.medium.hint': 'Monte Carlo tree search with 6 000 random fills per move.',
  'difficulty.hard.hint': 'Monte Carlo tree search for about 1500 ms per move.',
  'difficulty.expert.hint': 'Monte Carlo tree search for about 2500 ms per move.',
};

const es: Dictionary = {
  'menu.title': 'Hex 11×11',
  'menu.subtitle': 'El tablero clásico: escaleras, puentes y conexiones a larga distancia.',
  'board.label': 'Tablero de hex de 11 por 11',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Una búsqueda Monte Carlo corta; a menudo juega al azar.',
  'difficulty.medium.hint':
    'Búsqueda en árbol Monte Carlo con 6 000 rellenos aleatorios por jugada.',
  'difficulty.hard.hint': 'Búsqueda en árbol Monte Carlo durante unos 1500 ms por jugada.',
  'difficulty.expert.hint': 'Búsqueda en árbol Monte Carlo durante unos 2500 ms por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
