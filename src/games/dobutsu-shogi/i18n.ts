import type { Dictionary, Locale } from '../../core/i18n';
import { pieceStrings } from '../shared/shogi/i18n';

const pieces = pieceStrings({
  L: ['lion', 'león'],
  G: ['giraffe', 'jirafa'],
  E: ['elephant', 'elefante'],
  C: ['chick', 'pollito'],
  '+C': ['hen (promoted chick)', 'gallina (pollito promovido)'],
});

const en: Dictionary = {
  ...pieces.en,
  'menu.title': 'Animal Shogi 3×4',
  'menu.subtitle': 'A pocket shogi with four animals: catch the lion or walk yours home.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Looks two moves ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks four moves ahead.',
  'difficulty.hard.hint': 'Looks eight moves ahead with a memory of positions.',
  'difficulty.expert.hint': 'Searches as deep as about 1.5 seconds per move allow.',
  royal: 'lion',
};

const es: Dictionary = {
  ...pieces.es,
  'menu.title': 'Shogi de animales 3×4',
  'menu.subtitle':
    'Un shogi de bolsillo con cuatro animales: atrapa al león o lleva el tuyo a casa.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Mira dos jugadas por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira cuatro jugadas por delante.',
  'difficulty.hard.hint': 'Mira ocho jugadas por delante con memoria de posiciones.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,5 segundos por jugada.',
  royal: 'león',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
