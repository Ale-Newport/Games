import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Connect Five Gravity',
  'menu.subtitle': 'A wider 9×7 board and a longer goal: line up five falling discs.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Blocks obvious threats, otherwise plays loosely.',
  'difficulty.medium.hint': 'Thinks four moves ahead.',
  'difficulty.hard.hint': 'Deep search — around twelve moves ahead.',
  'board.label': 'Connect Five board: choose a column',
  keys: 'Keys: ←/→ choose column · ↓/Enter drop · 1–9 drop in column · U undo · H hint · R restart · N next',
};

const es: Dictionary = {
  'menu.title': 'Cinco en línea con gravedad',
  'menu.subtitle':
    'Un tablero más ancho de 9×7 y un objetivo más largo: alinea cinco fichas que caen.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Bloquea amenazas obvias; si no, juega relajado.',
  'difficulty.medium.hint': 'Piensa cuatro jugadas adelante.',
  'difficulty.hard.hint': 'Búsqueda profunda: unas doce jugadas adelante.',
  'board.label': 'Tablero de cinco en línea: elige una columna',
  keys: 'Teclas: ←/→ elegir columna · ↓/Intro soltar · 1–9 soltar en columna · U deshacer · H pista · R reiniciar · N siguiente',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
