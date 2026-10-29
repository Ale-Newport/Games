import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Water Sort',
    'menu.subtitle':
      'Pour the colored liquids between tubes until every tube holds a single color. A pour moves the whole top layer.',
    'level.easy': '4 colors',
    'level.medium': '7 colors',
    'level.hard': '10 colors',
    'level.expert': '12 colors',
    'level.easy.hint': 'Six tubes, two of them empty.',
    'level.medium.hint': 'Nine tubes, two of them empty.',
    'level.hard.hint': 'Twelve tubes, two of them empty.',
    'level.expert.hint': 'Fourteen tubes, two of them empty.',
    select: 'Tap a tube, then the tube to pour into.',
  },
  es: {
    title: 'Ordena los líquidos',
    'menu.subtitle':
      'Vierte los líquidos de colores entre tubos hasta que cada tubo tenga un solo color. Al verter pasa toda la capa de arriba.',
    'level.easy': '4 colores',
    'level.medium': '7 colores',
    'level.hard': '10 colores',
    'level.expert': '12 colores',
    'level.easy.hint': 'Seis tubos, dos de ellos vacíos.',
    'level.medium.hint': 'Nueve tubos, dos de ellos vacíos.',
    'level.hard.hint': 'Doce tubos, dos de ellos vacíos.',
    'level.expert.hint': 'Catorce tubos, dos de ellos vacíos.',
    select: 'Toca un tubo y luego el tubo en el que verter.',
  },
};
