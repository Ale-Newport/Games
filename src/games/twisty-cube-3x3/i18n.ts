import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Twisty Cube 3×3',
    'menu.subtitle': 'The classic 3×3 twisty cube in 3D, with a two-phase solver for hints.',
    'level.easy': '3 turns',
    'level.medium': '7 turns',
    'level.full': 'Full scramble',
    'level.easy.hint': 'Undo three random turns.',
    'level.medium.hint': 'Undo seven random turns.',
    'level.full.hint': 'A random-state scramble of 25 turns.',
  },
  es: {
    title: 'Cubo giratorio 3×3',
    'menu.subtitle':
      'El clásico cubo giratorio 3×3 en 3D, con un solucionador en dos fases para las pistas.',
    'level.easy': '3 giros',
    'level.medium': '7 giros',
    'level.full': 'Mezcla completa',
    'level.easy.hint': 'Deshaz tres giros al azar.',
    'level.medium.hint': 'Deshaz siete giros al azar.',
    'level.full.hint': 'Una mezcla al azar de 25 giros.',
  },
};
