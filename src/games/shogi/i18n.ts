import type { Dictionary, Locale } from '../../core/i18n';
import { pieceStrings } from '../shared/shogi/i18n';

const pieces = pieceStrings({
  K: ['king', 'rey'],
  R: ['rook', 'torre'],
  B: ['bishop', 'alfil'],
  G: ['gold general', 'general de oro'],
  S: ['silver general', 'general de plata'],
  N: ['knight', 'caballo'],
  L: ['lance', 'lanza'],
  P: ['pawn', 'peón'],
  '+R': ['dragon (promoted rook)', 'dragón (torre promovida)'],
  '+B': ['horse (promoted bishop)', 'caballo dragón (alfil promovido)'],
  '+S': ['promoted silver', 'plata promovida'],
  '+N': ['promoted knight', 'caballo promovido'],
  '+L': ['promoted lance', 'lanza promovida'],
  '+P': ['tokin (promoted pawn)', 'tokin (peón promovido)'],
});

const en: Dictionary = {
  ...pieces.en,
  'menu.title': 'Shogi',
  'menu.subtitle': 'Japanese chess: captured pieces change sides and come back as drops.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Sees one move ahead and often plays a random move.',
  'difficulty.medium.hint': 'Looks three moves ahead, drops included.',
  'difficulty.hard.hint': 'Looks five moves ahead with a memory of positions.',
  'difficulty.expert.hint': 'Searches as deep as about 1.8 seconds per move allow.',
  royal: 'king',
};

const es: Dictionary = {
  ...pieces.es,
  'menu.title': 'Shogi',
  'menu.subtitle': 'Ajedrez japonés: las piezas capturadas cambian de bando y vuelven a entrar.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Ve una jugada por delante y a menudo juega al azar.',
  'difficulty.medium.hint': 'Mira tres jugadas por delante, lanzamientos incluidos.',
  'difficulty.hard.hint': 'Mira cinco jugadas por delante con memoria de posiciones.',
  'difficulty.expert.hint': 'Busca tan hondo como permiten unos 1,8 segundos por jugada.',
  royal: 'rey',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
