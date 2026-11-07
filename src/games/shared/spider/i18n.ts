import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the Spider games. */
export const SPIDER_STRINGS: Record<Locale, Dictionary> = {
  en: {
    'board.label': 'Spider table',
    'info.deals': 'Deals left {n}',
    'announce.deal': 'Ten new cards dealt.',
    'announce.move': '{n} card(s) from the {card} move to column {pile}.',
    'announce.run': 'A full run is complete and removed.',
    'announce.flip': 'A card turns up.',
    keys: 'Keys: ←/→ pile · ↑/↓ card · Enter pick / drop · D deal · A auto-move · U undo · H hint · N new deal',
  },
  es: {
    'board.label': 'Mesa de Spider',
    'info.deals': 'Repartos {n}',
    'announce.deal': 'Diez cartas nuevas repartidas.',
    'announce.move': '{n} carta(s) desde {card} a la columna {pile}.',
    'announce.run': 'Una escalera completa sale del juego.',
    'announce.flip': 'Se destapa una carta.',
    keys: 'Teclas: ←/→ montón · ↑/↓ carta · Intro coger / soltar · D repartir · A mover solo · U deshacer · H pista · N nueva partida',
  },
};
