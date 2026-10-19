import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Four in a Row',
  'menu.subtitle': 'Drop discs, stack them, and line up four before your opponent does.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Takes obvious wins and blocks, otherwise plays loosely.',
  'difficulty.medium.hint': 'Thinks five moves ahead.',
  'difficulty.hard.hint': 'Deep search — often more than ten moves ahead.',
  'board.label': 'Four in a Row board: choose a column',
  keys: 'Keys: ←/→ choose column · ↓/Enter drop · 1–7 drop in column · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'menu.title': 'Cuatro en línea',
  'menu.subtitle': 'Suelta fichas, apílalas y alinea cuatro antes que tu rival.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Aprovecha las victorias obvias y bloquea; si no, juega relajado.',
  'difficulty.medium.hint': 'Piensa cinco jugadas adelante.',
  'difficulty.hard.hint': 'Búsqueda profunda: a menudo más de diez jugadas adelante.',
  'board.label': 'Tablero de cuatro en línea: elige una columna',
  keys: 'Teclas: ←/→ elegir columna · ↓/Intro soltar · 1–7 soltar en columna · U deshacer · H pista · R reiniciar · N siguiente',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
