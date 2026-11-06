import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Go 13×13',
  'menu.subtitle': 'The middle board: room for real frameworks, still a short game.',
  'board.label': 'Go board, 13 by 13',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'A short Monte Carlo search; often plays a random move.',
  'difficulty.medium.hint': 'Monte Carlo tree search with a fixed number of playouts.',
  'difficulty.hard.hint': 'Monte Carlo tree search for about 1500 ms per move.',
  'difficulty.expert.hint': 'Monte Carlo tree search for about 2500 ms per move.',
};

const es: Dictionary = {
  'menu.title': 'Go 13×13',
  'menu.subtitle': 'El tablero intermedio: sitio para marcos de verdad en una partida corta.',
  'board.label': 'Tablero de go de 13 por 13',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Una búsqueda Monte Carlo corta; a menudo juega al azar.',
  'difficulty.medium.hint': 'Búsqueda en árbol Monte Carlo con un número fijo de simulaciones.',
  'difficulty.hard.hint': 'Búsqueda en árbol Monte Carlo durante unos 1500 ms por jugada.',
  'difficulty.expert.hint': 'Búsqueda en árbol Monte Carlo durante unos 2500 ms por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
