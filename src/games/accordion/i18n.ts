import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Accordion',
    'board.label': 'Accordion row',
    'stat.score': 'Piles',
    'pile.tableau': 'Pile',
    'info.row': 'Row {piles} · Stock {n}',
    'announce.deal': 'Dealt the {card}.',
    'announce.move': 'The {card} goes onto the {onto}.',
    keys: 'Keys: ←/→ pile · Enter pick / drop · D deal · A auto-move · U undo · H hint · N new deal',
  },
  es: {
    'menu.title': 'Acordeón',
    'board.label': 'Fila del acordeón',
    'stat.score': 'Montones',
    'pile.tableau': 'Montón',
    'info.row': 'Fila {piles} · Mazo {n}',
    'announce.deal': 'Repartida: {card}.',
    'announce.move': '{card} va sobre {onto}.',
    keys: 'Teclas: ←/→ montón · Intro coger / soltar · D repartir · A mover solo · U deshacer · H pista · N nueva partida',
  },
};
