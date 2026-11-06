import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Reversi 6×6',
  'menu.subtitle':
    'The same flips on a tighter board. Every square counts — and White has the edge.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Plays loosely.',
  'difficulty.medium.hint': 'Looks three moves ahead and finishes cleanly.',
  'difficulty.hard.hint': 'Plays the second half of the game perfectly.',
  'board.label': 'Reversi 6×6 board',
};

const es: Dictionary = {
  'menu.title': 'Reversi 6×6',
  'menu.subtitle':
    'Los mismos volteos en un tablero más pequeño. Cada casilla cuenta, y blancas tienen ventaja.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Juega relajado.',
  'difficulty.medium.hint': 'Mira tres jugadas adelante y cierra bien los finales.',
  'difficulty.hard.hint': 'Juega perfecta la segunda mitad de la partida.',
  'board.label': 'Tablero de reversi 6×6',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
