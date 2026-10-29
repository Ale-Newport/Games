import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Ball Sort',
    'menu.subtitle':
      'Move the balls one at a time between tubes until every tube holds a single color.',
    'level.easy': '4 colors',
    'level.medium': '7 colors',
    'level.hard': '9 colors',
    'level.expert': '12 colors',
    'level.easy.hint': 'Tubes of four, two of them empty.',
    'level.medium.hint': 'Tubes of four, two of them empty.',
    'level.hard.hint': 'Tubes of five, two of them empty.',
    'level.expert.hint': 'Tubes of five, two of them empty.',
    select: 'Tap a tube to lift its top ball, then the tube to drop it in.',
  },
  es: {
    title: 'Ordena las bolas',
    'menu.subtitle':
      'Mueve las bolas de una en una entre tubos hasta que cada tubo tenga un solo color.',
    'level.easy': '4 colores',
    'level.medium': '7 colores',
    'level.hard': '9 colores',
    'level.expert': '12 colores',
    'level.easy.hint': 'Tubos de cuatro, dos de ellos vacíos.',
    'level.medium.hint': 'Tubos de cuatro, dos de ellos vacíos.',
    'level.hard.hint': 'Tubos de cinco, dos de ellos vacíos.',
    'level.expert.hint': 'Tubos de cinco, dos de ellos vacíos.',
    select: 'Toca un tubo para coger la bola de arriba y luego el tubo donde soltarla.',
  },
};
