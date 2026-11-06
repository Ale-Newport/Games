import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Antichess',
  'menu.subtitle':
    'Lose all your pieces to win. Captures are compulsory and the king is just a piece.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Sees one move ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks two moves ahead through every forced capture.',
  'difficulty.hard.hint': 'Looks four moves ahead with a memory of positions.',
  'difficulty.expert.hint': 'Searches as deep as about 1.6 seconds per move allow.',
  'info.mustCapture': 'You must capture',
  'info.pieces': '{seat0} {a} · {seat1} {b} pieces left',
};

const es: Dictionary = {
  'menu.title': 'Antiajedrez',
  'menu.subtitle':
    'Pierde todas tus piezas para ganar. Capturar es obligatorio y el rey es una pieza más.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Ve una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira dos jugadas por delante a través de cada captura forzada.',
  'difficulty.hard.hint': 'Mira cuatro jugadas por delante con memoria de posiciones.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,6 segundos por jugada.',
  'info.mustCapture': 'Debes capturar',
  'info.pieces': 'Quedan: {seat0} {a} · {seat1} {b} piezas',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
