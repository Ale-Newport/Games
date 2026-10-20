import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Gardner Minichess',
  'menu.subtitle': 'A full chess army squeezed onto a 5×5 board: sharp, fast and tactical.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Sees one move ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks three moves ahead.',
  'difficulty.hard.hint': 'Looks six moves ahead with a memory of positions.',
  'difficulty.expert.hint': 'Searches as deep as about 1.6 seconds per move allow.',
};

const es: Dictionary = {
  'menu.title': 'Minichess de Gardner',
  'menu.subtitle': 'Un ejército de ajedrez completo en un tablero de 5×5: agudo, rápido y táctico.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Ve una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira tres jugadas por delante.',
  'difficulty.hard.hint': 'Mira seis jugadas por delante con memoria de posiciones.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,6 segundos por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
