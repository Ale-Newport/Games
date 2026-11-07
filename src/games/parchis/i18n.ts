import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Parchís',
    'menu.subtitle':
      "Spain's favourite race game: a five to come out, barriers that block the road, safe squares, and bonus moves of 20 for a capture and 10 for a pawn home.",
    board: 'Parchís board',
    'label.token': '{side} pawn {n}',
    pick: 'Tap a marked pawn to move it.',
    pickBonus: 'Bonus: move a pawn {n} squares.',
    'hint.out': 'Suggested: bring pawn {n} out.',
    'hint.move': 'Suggested: move pawn {n}.',
  },
  es: {
    title: 'Parchís',
    'menu.subtitle':
      'El juego de carreras favorito de España: un cinco para salir, barreras que cortan el paso, seguros, y premios de 20 por comerse una ficha y 10 por meterla en casa.',
    board: 'Tablero de parchís',
  },
};
