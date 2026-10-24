import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the Klondike games. */
export const KLONDIKE_STRINGS: Record<Locale, Dictionary> = {
  en: {
    'board.label': 'Klondike table',
    'announce.draw': 'Drew the {card}.',
    'announce.recycle': 'The waste goes back to the stock.',
    'announce.home': 'The {card} goes to its foundation.',
    'announce.move': 'The {card} moves to column {pile}.',
    'announce.flip': 'A card turns up.',
  },
  es: {
    'board.label': 'Mesa de solitario',
    'announce.draw': 'Robas: {card}.',
    'announce.recycle': 'El descarte vuelve al mazo.',
    'announce.home': 'A su fundación: {card}.',
    'announce.move': 'A la columna {pile}: {card}.',
    'announce.flip': 'Se destapa una carta.',
  },
};
