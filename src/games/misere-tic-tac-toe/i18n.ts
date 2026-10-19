import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Misère Tic-Tac-Toe',
  'menu.subtitle':
    'Everything is backwards: whoever completes three in a row loses. Make your opponent do it.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.perfect': 'Perfect',
  'difficulty.easy.hint': 'Often walks into lines it should avoid.',
  'difficulty.medium.hint': 'Careful, but can be squeezed into a corner.',
  'difficulty.perfect.hint': 'Exact solver: it never loses. A draw is the best you can do.',
  'board.label': 'Misère Tic-Tac-Toe board',
  'result.lineX': 'X completed three in a row.',
  'result.lineO': 'O completed three in a row.',
  'result.noLine': 'Nobody completed a line.',
  keys: 'Keys: arrows/WASD move · Enter place · 1–9 keypad · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'menu.title': 'Tres en raya inverso',
  'menu.subtitle':
    'Todo al revés: quien completa tres en línea pierde. Obliga a tu rival a hacerlo.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.perfect': 'Perfecto',
  'difficulty.easy.hint': 'A menudo cae en las líneas que debería evitar.',
  'difficulty.medium.hint': 'Cuidadoso, pero se le puede acorralar.',
  'difficulty.perfect.hint':
    'Solucionador exacto: nunca pierde. Empatar es lo mejor que puedes lograr.',
  'board.label': 'Tablero de tres en raya inverso',
  'result.lineX': 'X completó tres en línea.',
  'result.lineO': 'O completó tres en línea.',
  'result.noLine': 'Nadie completó una línea.',
  keys: 'Teclas: flechas/WASD mover · Intro colocar · 1–9 teclado numérico · U deshacer · H pista · R reiniciar · N siguiente',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
