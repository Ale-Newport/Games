import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Five Dice',
    'menu.subtitle':
      'Roll five dice up to three times a turn and fill thirteen boxes: the faces, three and four of a kind, a full house, straights, five of a kind and chance.',
    'box.ones': 'Ones',
    'box.twos': 'Twos',
    'box.threes': 'Threes',
    'box.fours': 'Fours',
    'box.fives': 'Fives',
    'box.sixes': 'Sixes',
    'box.threeKind': 'Three of a kind',
    'box.fourKind': 'Four of a kind',
    'box.fullHouse': 'Full house',
    'box.smallStraight': 'Small straight',
    'box.largeStraight': 'Large straight',
    'box.fiveKind': 'Five of a kind',
    'box.chance': 'Chance',
    upper: 'Upper (bonus 35 at 63)',
  },
  es: {
    title: 'Cinco dados',
    'menu.subtitle':
      'Tira cinco dados hasta tres veces por turno y rellena trece casillas: las caras, trío y póquer, full, escaleras, cinco iguales y suerte.',
    'box.ones': 'Unos',
    'box.twos': 'Doses',
    'box.threes': 'Treses',
    'box.fours': 'Cuatros',
    'box.fives': 'Cincos',
    'box.sixes': 'Seises',
    'box.threeKind': 'Trío',
    'box.fourKind': 'Póquer',
    'box.fullHouse': 'Full',
    'box.smallStraight': 'Escalera corta',
    'box.largeStraight': 'Escalera larga',
    'box.fiveKind': 'Cinco iguales',
    'box.chance': 'Suerte',
    upper: 'Superior (bono de 35 con 63)',
  },
};
