import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Nim',
    'menu.subtitle': 'Take any number from one heap — whoever takes the last counter wins.',
    'difficulty.easy.hint': 'Knows the trick but rarely uses it.',
    'difficulty.medium.hint': 'Usually finds the winning move.',
    'difficulty.hard.hint': 'Perfect play: you need a winning start and no slips.',
    'info.goal': 'Take the last counter to win',
  },
  es: {
    'menu.title': 'Nim',
    'menu.subtitle': 'Toma las fichas que quieras de un montón: quien se lleva la última gana.',
    'difficulty.easy.hint': 'Conoce el truco pero casi nunca lo usa.',
    'difficulty.medium.hint': 'Suele encontrar la jugada ganadora.',
    'difficulty.hard.hint': 'Juego perfecto: necesitas un inicio ganador y ningún error.',
    'info.goal': 'Toma la última ficha para ganar',
  },
};
