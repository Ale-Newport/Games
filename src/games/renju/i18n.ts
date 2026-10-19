import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Renju',
  'menu.subtitle':
    'Competition five-in-a-row: Black opens in the center but may not make 3-3, 4-4 or overlines.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',
  'difficulty.easy.hint': 'Plays loosely — a good first opponent.',
  'difficulty.medium.hint': 'Spots threats instantly but does not look ahead.',
  'difficulty.hard.hint': 'Searches four moves deep and knows the restrictions.',
  'difficulty.expert.hint': 'Searches up to six moves deep.',
  'board.label': 'Renju board',
  'point.forbidden': '{point}, forbidden for Black',
  'result.exactFive': 'Black needs exactly five; White wins with five or more.',
};

const es: Dictionary = {
  'menu.title': 'Renju',
  'menu.subtitle':
    'Cinco en línea de competición: negras abren en el centro pero no pueden hacer 3-3, 4-4 ni líneas largas.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.expert': 'Experto',
  'difficulty.easy.hint': 'Juega relajado: un buen primer rival.',
  'difficulty.medium.hint': 'Ve las amenazas al instante, pero no mira hacia adelante.',
  'difficulty.hard.hint': 'Busca cuatro jugadas en profundidad y conoce las restricciones.',
  'difficulty.expert.hint': 'Busca hasta seis jugadas en profundidad.',
  'board.label': 'Tablero de renju',
  'point.forbidden': '{point}, prohibido para negras',
  'result.exactFive': 'Negras necesitan exactamente cinco; blancas ganan con cinco o más.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
