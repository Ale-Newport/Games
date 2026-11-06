import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'King of the Hill',
  'menu.subtitle': 'Chess where walking your king onto one of the four center squares also wins.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Sees one move ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks two moves ahead and always takes the hill when it can.',
  'difficulty.hard.hint': 'Looks four moves ahead and races its king when it is safe.',
  'difficulty.expert.hint': 'Searches as deep as about 1.6 seconds per move allow.',
  'info.hill': 'Hill: d4 · e4 · d5 · e5',
};

const es: Dictionary = {
  'menu.title': 'Rey de la colina',
  'menu.subtitle':
    'Ajedrez en el que llevar tu rey a una de las cuatro casillas centrales también gana.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Ve una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira dos jugadas por delante y siempre sube a la colina si puede.',
  'difficulty.hard.hint': 'Mira cuatro jugadas por delante y adelanta su rey cuando es seguro.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,6 segundos por jugada.',
  'info.hill': 'Colina: d4 · e4 · d5 · e5',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
