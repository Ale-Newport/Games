import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Go 9×9',
  'menu.subtitle': 'The quick board: every stone matters, games last minutes.',
  'board.label': 'Go board, 9 by 9',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'A short Monte Carlo search; often plays a random move.',
  'difficulty.medium.hint': 'Monte Carlo tree search with a fixed number of playouts.',
  'difficulty.hard.hint': 'Monte Carlo tree search for about 1000 ms per move.',
  'difficulty.expert.hint': 'Monte Carlo tree search for about 2000 ms per move.',
};

const es: Dictionary = {
  'menu.title': 'Go 9×9',
  'menu.subtitle': 'El tablero rápido: cada piedra cuenta y las partidas duran minutos.',
  'board.label': 'Tablero de go de 9 por 9',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Una búsqueda Monte Carlo corta; a menudo juega al azar.',
  'difficulty.medium.hint': 'Búsqueda en árbol Monte Carlo con un número fijo de simulaciones.',
  'difficulty.hard.hint': 'Búsqueda en árbol Monte Carlo durante unos 1000 ms por jugada.',
  'difficulty.expert.hint': 'Búsqueda en árbol Monte Carlo durante unos 2000 ms por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
