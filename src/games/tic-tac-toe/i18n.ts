import type { Dictionary, Locale } from '../../core/i18n';

/** Tic-Tac-Toe strings layered over the shared m,n,k strings (src/games/shared/mnk/i18n.ts). */
const en: Dictionary = {
  'menu.title': 'Tic-Tac-Toe',
  'menu.subtitle':
    'Three in a row on a 3×3 grid. Simple to learn, impossible to beat when played perfectly.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.perfect': 'Perfect',
  'difficulty.easy.hint': 'Plays loosely — good for learning.',
  'difficulty.medium.hint': 'Blocks your threats, but can be forked.',
  'difficulty.perfect.hint': 'Never loses. A draw is a great result.',
  'board.label': 'Tic-Tac-Toe board',
  keys: 'Keys: arrows/WASD move · Enter place · 1–9 keypad · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'menu.title': 'Tres en raya',
  'menu.subtitle':
    'Tres en línea en una cuadrícula de 3×3. Fácil de aprender, imposible de vencer con juego perfecto.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.perfect': 'Perfecto',
  'difficulty.easy.hint': 'Juega de forma relajada: ideal para aprender.',
  'difficulty.medium.hint': 'Bloquea tus amenazas, pero cae en horquillas.',
  'difficulty.perfect.hint': 'Nunca pierde. Empatar es un gran resultado.',
  'board.label': 'Tablero de tres en raya',
  keys: 'Teclas: flechas/WASD mover · Intro colocar · 1–9 teclado numérico · U deshacer · H pista · R reiniciar · N siguiente',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
