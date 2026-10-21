import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Go 19×19',
  'menu.subtitle': 'The full board: corners, sides and center — the classic game.',
  'board.label': 'Go board, 19 by 19',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'A short Monte Carlo search; often plays a random move.',
  'difficulty.medium.hint': 'Monte Carlo tree search with a fixed number of playouts.',
  'difficulty.hard.hint': 'Monte Carlo tree search for about 2000 ms per move.',
};

const es: Dictionary = {
  'menu.title': 'Go 19×19',
  'menu.subtitle': 'El tablero completo: esquinas, lados y centro, el juego clásico.',
  'board.label': 'Tablero de go de 19 por 19',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Una búsqueda Monte Carlo corta; a menudo juega al azar.',
  'difficulty.medium.hint': 'Búsqueda en árbol Monte Carlo con un número fijo de simulaciones.',
  'difficulty.hard.hint': 'Búsqueda en árbol Monte Carlo durante unos 2000 ms por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
