import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Spanish Checkers',
  'menu.subtitle':
    'Damas españolas: flying kings, forward-only men, and the most pieces — then the most kings — must be taken.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Looks two moves ahead and often plays loosely.',
  'difficulty.medium.hint': 'Looks four moves ahead.',
  'difficulty.hard.hint': 'Deep iterative search within 0.7 s per move.',
  'board.label': 'Spanish checkers board',
  'seat.0': 'White',
  'seat.1': 'Black',
  'piece.0': 'white',
  'piece.1': 'black',
  'menu.name0': 'White player',
  'menu.name1': 'Black player',
  'menu.agent0': 'White agent',
  'menu.agent1': 'Black agent',
};

const es: Dictionary = {
  'menu.title': 'Damas españolas',
  'menu.subtitle':
    'Damas voladoras, peones que solo avanzan, y hay que capturar más piezas y, a igualdad, más damas.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Mira dos jugadas adelante y a menudo juega relajado.',
  'difficulty.medium.hint': 'Mira cuatro jugadas adelante.',
  'difficulty.hard.hint': 'Búsqueda iterativa profunda en 0,7 s por jugada.',
  'board.label': 'Tablero de damas españolas',
  'seat.0': 'Blancas',
  'seat.1': 'Negras',
  'piece.0': 'blanco',
  'piece.1': 'negro',
  'menu.name0': 'Jugador de blancas',
  'menu.name1': 'Jugador de negras',
  'menu.agent0': 'Agente de blancas',
  'menu.agent1': 'Agente de negras',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
