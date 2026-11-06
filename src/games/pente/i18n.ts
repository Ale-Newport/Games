import type { Dictionary, Locale } from '../../core/i18n';

const en: Dictionary = {
  'menu.title': 'Pente',
  'menu.subtitle': 'Five in a row — or capture five pairs. Bracket two enemy stones to take them.',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.easy.hint': 'Looks one move ahead and often plays loosely.',
  'difficulty.medium.hint': 'Looks two moves ahead, watching captures.',
  'difficulty.hard.hint': 'Searches up to five moves ahead.',
  'board.label': 'Pente board',
  'point.blocked': '{point}, not allowed by the tournament rule',
  'info.captures': 'Captured pairs — Black {b} · White {w} (5 wins)',
  'announce.capture': '{seat} played {point} and captured {n} pairs.',
  'result.byCaptures': '{seat} captured five pairs.',
  'result.byFive': '{seat} made five in a row.',
};

const es: Dictionary = {
  'menu.title': 'Pente',
  'menu.subtitle':
    'Cinco en línea, o captura cinco parejas. Encierra dos piedras rivales para quitarlas.',
  'difficulty.easy': 'Fácil',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difícil',
  'difficulty.easy.hint': 'Mira una jugada adelante y a menudo juega relajado.',
  'difficulty.medium.hint': 'Mira dos jugadas adelante, atento a las capturas.',
  'difficulty.hard.hint': 'Busca hasta cinco jugadas adelante.',
  'board.label': 'Tablero de pente',
  'point.blocked': '{point}, no permitido por la regla de torneo',
  'info.captures': 'Parejas capturadas — Negras {b} · Blancas {w} (5 ganan)',
  'announce.capture': '{seat} jugó en {point} y capturó {n} parejas.',
  'result.byCaptures': '{seat} capturó cinco parejas.',
  'result.byFive': '{seat} hizo cinco en línea.',
};

export const STRINGS: Record<Locale, Dictionary> = { en, es };
