import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the column patiences. */
export const COLUMNS_STRINGS: Record<Locale, Dictionary> = {
  en: {
    'info.stock': 'Stock {n}',
    'announce.deal': 'New cards dealt.',
    'announce.home': 'The {card} goes home.',
    'announce.move': '{n} card(s) from the {card} move to column {pile}.',
    'announce.run': 'A full run is complete and removed.',
    'announce.flip': 'A card turns up.',
    keys: 'Keys: ←/→ pile · ↑/↓ card · Enter pick / drop · D deal · A auto-move · U undo · H hint · F finish · N new deal',
  },
  es: {
    'info.stock': 'Mazo {n}',
    'announce.deal': 'Cartas nuevas repartidas.',
    'announce.home': 'A casa: {card}.',
    'announce.move': '{n} carta(s) desde {card} a la columna {pile}.',
    'announce.run': 'Una escalera completa sale del juego.',
    'announce.flip': 'Se destapa una carta.',
    keys: 'Teclas: ←/→ montón · ↑/↓ carta · Intro coger / soltar · D repartir · A mover solo · U deshacer · H pista · F terminar · N nueva partida',
  },
};
