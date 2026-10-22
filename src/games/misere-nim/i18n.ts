import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Misère Nim',
    'menu.subtitle': 'Nim turned upside down: whoever takes the last counter loses.',
    'difficulty.easy.hint': 'Knows the trick but rarely uses it.',
    'difficulty.medium.hint': 'Usually finds the winning move.',
    'difficulty.hard.hint': 'Perfect play: you need a winning start and no slips.',
    'info.goal': 'Leave the last counter to your opponent',
  },
  es: {
    'menu.title': 'Nim misère',
    'menu.subtitle': 'El Nim al revés: quien toma la última ficha pierde.',
    'difficulty.easy.hint': 'Conoce el truco pero casi nunca lo usa.',
    'difficulty.medium.hint': 'Suele encontrar la jugada ganadora.',
    'difficulty.hard.hint': 'Juego perfecto: necesitas un inicio ganador y ningún error.',
    'info.goal': 'Deja la última ficha a tu rival',
  },
};
