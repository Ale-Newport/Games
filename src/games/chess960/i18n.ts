import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Chess960',
  'menu.subtitle': 'Chess with the back rank shuffled: one of 960 start positions every round.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Sees one move ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks two moves ahead and never leaves a capture unexamined.',
  'difficulty.hard.hint': 'Looks four moves ahead with move ordering and a memory of positions.',
  'difficulty.expert.hint': 'Searches as deep as about 1.6 seconds per move allow.',
  'info.start': 'Start position #{n}',
};

const es: Dictionary = {
  'menu.title': 'Ajedrez 960',
  'menu.subtitle':
    'Ajedrez con la fila de atrás barajada: una de 960 posiciones iniciales en cada ronda.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Ve una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira dos jugadas por delante y siempre revisa las capturas.',
  'difficulty.hard.hint':
    'Mira cuatro jugadas por delante con ordenación de jugadas y memoria de posiciones.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,6 segundos por jugada.',
  'info.start': 'Posición inicial n.º {n}',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
