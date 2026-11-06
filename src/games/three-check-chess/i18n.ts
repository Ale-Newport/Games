import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Three-Check Chess',
  'menu.subtitle': 'Chess where the third check you give wins the game on the spot.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Sees one move ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks two moves ahead and grabs free checks.',
  'difficulty.hard.hint': 'Looks four moves ahead and guards its king against check sequences.',
  'difficulty.expert.hint': 'Searches as deep as about 1.6 seconds per move allow.',
};

const es: Dictionary = {
  'menu.title': 'Ajedrez de tres jaques',
  'menu.subtitle': 'Ajedrez en el que el tercer jaque que das gana la partida al instante.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Ve una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira dos jugadas por delante y aprovecha los jaques gratis.',
  'difficulty.hard.hint':
    'Mira cuatro jugadas por delante y protege su rey de las series de jaques.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,6 segundos por jugada.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
