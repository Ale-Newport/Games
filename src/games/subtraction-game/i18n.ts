import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Subtraction Game',
    'menu.subtitle': 'One heap, take 1, 2 or 3 — whoever takes the last counter wins.',
    'difficulty.easy.hint': 'Knows the trick but rarely uses it.',
    'difficulty.medium.hint': 'Usually finds the winning move.',
    'difficulty.hard.hint': 'Perfect play: you need a winning start and no slips.',
    'info.goal': 'Take 1, 2 or 3 — the last counter wins',
  },
  es: {
    'menu.title': 'Juego de la resta',
    'menu.subtitle': 'Un montón, toma 1, 2 o 3: quien se lleva la última ficha gana.',
    'difficulty.easy.hint': 'Conoce el truco pero casi nunca lo usa.',
    'difficulty.medium.hint': 'Suele encontrar la jugada ganadora.',
    'difficulty.hard.hint': 'Juego perfecto: necesitas un inicio ganador y ningún error.',
    'info.goal': 'Toma 1, 2 o 3: la última ficha gana',
  },
};
