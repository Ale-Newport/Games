import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Twisty Cube 4×4',
    'menu.subtitle': 'The 4×4 twisty cube in 3D, with wide turns for its inner layers.',
    'level.easy': '3 turns',
    'level.medium': '8 turns',
    'level.full': 'Full scramble',
    'level.easy.hint': 'Undo three random turns.',
    'level.medium.hint': 'Undo eight random turns.',
    'level.full.hint': 'A 40-turn scramble with wide turns.',
  },
  es: {
    title: 'Cubo giratorio 4×4',
    'menu.subtitle': 'El cubo giratorio 4×4 en 3D, con giros dobles para sus capas interiores.',
    'level.easy': '3 giros',
    'level.medium': '8 giros',
    'level.full': 'Mezcla completa',
    'level.easy.hint': 'Deshaz tres giros al azar.',
    'level.medium.hint': 'Deshaz ocho giros al azar.',
    'level.full.hint': 'Una mezcla de 40 giros con giros dobles.',
  },
};
