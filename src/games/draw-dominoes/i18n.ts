import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Draw Dominoes',
    'menu.subtitle':
      'Match an open end; when nothing fits, draw from the boneyard until something does. Go out first to score the others’ pips. First to 100 wins.',
  },
  es: {
    title: 'Dominó de robo',
    'menu.subtitle':
      'Casa un extremo abierto; si no te cabe nada, roba del pozo hasta que algo encaje. Quédate sin fichas antes para apuntarte los puntos de los demás. Gana quien llegue a 100.',
  },
};
