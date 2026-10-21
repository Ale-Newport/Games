import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': "Six Men's Morris",
  'menu.subtitle': 'The compact mill game on two squares: six pieces, no flying.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Looks a move ahead and often plays a random move.',
  'difficulty.medium.hint': 'A short alpha-beta search that values mills, threats and mobility.',
  'difficulty.hard.hint': 'Deep iterative-deepening search.',
};

const es: Dictionary = {
  'menu.title': 'Molino de seis',
  'menu.subtitle': 'El molino compacto en dos cuadrados: seis fichas y sin vuelo.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Mira una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint':
    'Una búsqueda alfa-beta corta que valora molinos, amenazas y movilidad.',
  'difficulty.hard.hint': 'Búsqueda profunda con profundización iterativa.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
