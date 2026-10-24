import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'FreeCell',
    'board.label': 'FreeCell table',
    'stat.score': 'Home',
    'announce.home': 'The {card} goes home.',
    'announce.cell': 'The {card} goes to a free cell.',
    'announce.move': 'The {card} moves to column {pile}.',
    keys: 'Keys: ←/→ pile · ↑/↓ card · Enter pick / drop · A auto-move · U undo · H hint · F finish · N new deal',
  },
  es: {
    'menu.title': 'FreeCell',
    'board.label': 'Mesa de FreeCell',
    'stat.score': 'En casa',
    'announce.home': 'A casa: {card}.',
    'announce.cell': 'A una celda libre: {card}.',
    'announce.move': 'A la columna {pile}: {card}.',
    keys: 'Teclas: ←/→ montón · ↑/↓ carta · Intro coger / soltar · A mover solo · U deshacer · H pista · F terminar · N nueva partida',
  },
};
