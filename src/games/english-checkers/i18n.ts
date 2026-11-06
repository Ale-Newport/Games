import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'English Checkers',
  'menu.subtitle': 'Classic 8×8 checkers: jump, chain captures, crown your kings.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Looks two moves ahead and often plays loosely.',
  'difficulty.medium.hint': 'Looks four moves ahead.',
  'difficulty.hard.hint': 'Deep search — often ten or more moves ahead.',
  'board.label': 'Checkers board',
  'seat.0': 'Black',
  'seat.1': 'White',
  'piece.0': 'black',
  'piece.1': 'white',
  'menu.name0': 'Black player',
  'menu.name1': 'White player',
  'menu.agent0': 'Black agent',
  'menu.agent1': 'White agent',
};

const es: Dictionary = {
  'menu.title': 'Damas inglesas',
  'menu.subtitle': 'Las damas clásicas de 8×8: salta, encadena capturas y corona tus damas.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Mira dos jugadas adelante y a menudo juega relajado.',
  'difficulty.medium.hint': 'Mira cuatro jugadas adelante.',
  'difficulty.hard.hint': 'Búsqueda profunda: a menudo diez jugadas o más.',
  'board.label': 'Tablero de damas',
  'seat.0': 'Negras',
  'seat.1': 'Blancas',
  'piece.0': 'negro',
  'piece.1': 'blanco',
  'menu.name0': 'Jugador de negras',
  'menu.name1': 'Jugador de blancas',
  'menu.agent0': 'Agente de negras',
  'menu.agent1': 'Agente de blancas',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
