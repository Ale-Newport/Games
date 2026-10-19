import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Gomoku',
  'menu.subtitle': 'Five in a row on a 15×15 board. Simple rules, deep tactics.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Plays loosely — a good first opponent.',
  'difficulty.medium.hint': 'Spots threats instantly but does not look ahead.',
  'difficulty.hard.hint': 'Searches four moves deep.',
  'difficulty.expert.hint': 'Searches up to six moves deep. Bring your best.',
  'board.label': 'Gomoku board',
};

const es: Dictionary = {
  'menu.title': 'Gomoku',
  'menu.subtitle': 'Cinco en línea en un tablero de 15×15. Reglas simples, táctica profunda.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Juega relajado: un buen primer rival.',
  'difficulty.medium.hint': 'Ve las amenazas al instante, pero no mira hacia adelante.',
  'difficulty.hard.hint': 'Busca cuatro jugadas en profundidad.',
  'difficulty.expert.hint': 'Busca hasta seis jugadas en profundidad. Da lo mejor de ti.',
  'board.label': 'Tablero de gomoku',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
