import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Generala',
    'menu.subtitle':
      'The dice game of the River Plate: three rolls a turn, eleven boxes, extra points for hands served on the first roll — and a served generala wins at once.',
    'box.ones': 'Ones',
    'box.twos': 'Twos',
    'box.threes': 'Threes',
    'box.fours': 'Fours',
    'box.fives': 'Fives',
    'box.sixes': 'Sixes',
    'box.straight': 'Straight',
    'box.fullHouse': 'Full house',
    'box.fourKind': 'Four of a kind',
    'box.generala': 'Generala',
    'box.doubleGenerala': 'Double generala',
    upper: 'Numbers',
  },
  es: {
    title: 'Generala',
    'menu.subtitle':
      'El juego de dados del Río de la Plata: tres tiradas por turno, once casillas, puntos extra por las jugadas servidas y una generala servida gana al instante.',
    'box.ones': 'Al 1',
    'box.twos': 'Al 2',
    'box.threes': 'Al 3',
    'box.fours': 'Al 4',
    'box.fives': 'Al 5',
    'box.sixes': 'Al 6',
    'box.straight': 'Escalera',
    'box.fullHouse': 'Full',
    'box.fourKind': 'Póker',
    'box.generala': 'Generala',
    'box.doubleGenerala': 'Doble generala',
    upper: 'Números',
  },
};
