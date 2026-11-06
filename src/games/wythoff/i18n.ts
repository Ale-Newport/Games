import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': "Wythoff's Game",
    'menu.subtitle': 'Two heaps: take from one, or the same amount from both. Last counter wins.',
    'difficulty.easy.hint': 'Knows the safe pairs but rarely uses them.',
    'difficulty.medium.hint': 'Usually finds the winning move.',
    'difficulty.hard.hint': 'Perfect play: you need a winning start and no slips.',
    'info.goal': 'Take the last counter to win',
    keys: 'Keys: arrows pick a counter · Enter choose / confirm · B both heaps · Esc cancel · U undo · H hint · R restart · N next',
  },
  es: {
    'menu.title': 'Juego de Wythoff',
    'menu.subtitle': 'Dos montones: toma de uno, o lo mismo de ambos. La última ficha gana.',
    'difficulty.easy.hint': 'Conoce los pares seguros pero casi nunca los usa.',
    'difficulty.medium.hint': 'Suele encontrar la jugada ganadora.',
    'difficulty.hard.hint': 'Juego perfecto: necesitas un inicio ganador y ningún error.',
    'info.goal': 'Toma la última ficha para ganar',
    keys: 'Teclas: flechas elegir ficha · Intro elegir / confirmar · B ambos montones · Esc cancelar · U deshacer · H pista · R reiniciar · N siguiente',
  },
};
