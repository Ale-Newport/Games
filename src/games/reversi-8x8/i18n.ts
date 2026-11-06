import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Reversi',
  'menu.subtitle': 'Outflank and flip. The classic 8×8 disc game — corners are king.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Plays loosely and often gives up corners.',
  'difficulty.medium.hint': 'Values corners and mobility, looks three moves ahead.',
  'difficulty.hard.hint': 'Deep search and a perfect endgame.',
  'board.label': 'Reversi board',
};

const es: Dictionary = {
  'menu.title': 'Reversi',
  'menu.subtitle': 'Encierra y voltea. El clásico juego de fichas de 8×8: las esquinas mandan.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Juega relajado y a menudo regala esquinas.',
  'difficulty.medium.hint': 'Valora esquinas y movilidad; mira tres jugadas adelante.',
  'difficulty.hard.hint': 'Búsqueda profunda y un final perfecto.',
  'board.label': 'Tablero de reversi',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
