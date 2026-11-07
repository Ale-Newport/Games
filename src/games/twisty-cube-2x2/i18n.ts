import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Twisty Cube 2×2',
    'menu.subtitle':
      'The 2×2 pocket cube: eight corners to sort, with a solver that always knows the shortest way.',
    'level.easy': '3 turns',
    'level.medium': '6 turns',
    'level.full': 'Full scramble',
    'level.easy.hint': 'Undo three random turns.',
    'level.medium.hint': 'Undo six random turns.',
    'level.full.hint': 'A random-state scramble: at most 11 turns from solved.',
  },
  es: {
    title: 'Cubo giratorio 2×2',
    'menu.subtitle':
      'El cubo de bolsillo 2×2: ocho esquinas que ordenar, con un solucionador que siempre conoce el camino más corto.',
    'level.easy': '3 giros',
    'level.medium': '6 giros',
    'level.full': 'Mezcla completa',
    'level.easy.hint': 'Deshaz tres giros al azar.',
    'level.medium.hint': 'Deshaz seis giros al azar.',
    'level.full.hint': 'Una mezcla al azar: como mucho a 11 giros de la solución.',
  },
};
