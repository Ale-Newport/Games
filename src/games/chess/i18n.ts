import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Chess',
  'menu.subtitle': 'The classic game of kings: full rules, clocks and four computer levels.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Sees one move ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks two moves ahead and never leaves a capture unexamined.',
  'difficulty.hard.hint': 'Looks four moves ahead with move ordering and a memory of positions.',
  'difficulty.expert.hint': 'Searches as deep as about 1.6 seconds per move allow.',
};

const es: Dictionary = {
  'menu.title': 'Ajedrez',
  'menu.subtitle': 'El clásico juego de reyes: reglas completas, relojes y cuatro niveles de CPU.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Ve una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira dos jugadas por delante y siempre revisa las capturas.',
  'difficulty.hard.hint':
    'Mira cuatro jugadas por delante con ordenación de jugadas y memoria de posiciones.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,6 segundos por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
