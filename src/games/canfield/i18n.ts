import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Canfield',
    'board.label': 'Canfield table',
    'stat.score': 'Home',
    'pile.cell': 'Reserve',
    'info.reserve': 'Reserve {n} · Base {base}',
    'announce.draw': 'Cards turned from the stock.',
    'announce.recycle': 'The waste goes back to the stock.',
    'announce.home': 'The {card} goes home.',
    'announce.move': 'The {card} moves to pile {pile}.',
  },
  es: {
    'menu.title': 'Canfield',
    'board.label': 'Mesa de Canfield',
    'stat.score': 'En casa',
    'pile.cell': 'Reserva',
    'info.reserve': 'Reserva {n} · Base {base}',
    'announce.draw': 'Se giran cartas del mazo.',
    'announce.recycle': 'El descarte vuelve al mazo.',
    'announce.home': 'A casa: {card}.',
    'announce.move': 'Al montón {pile}: {card}.',
  },
};
