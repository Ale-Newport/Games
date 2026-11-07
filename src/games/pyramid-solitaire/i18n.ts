import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Pyramid',
    'board.label': 'Pyramid table',
    'info.passes': 'Passes left {n}',
    'pile.tableau': 'Pyramid card',
    'announce.draw': 'A card turned from the stock.',
    'announce.recycle': 'The waste goes back to the stock.',
    'announce.pair': 'The {a} and the {b} make 13 and are removed.',
    'announce.king': 'The {card} is removed.',
    keys: 'Keys: ←/→ card · Enter pick / pair · D draw · A remove · U undo · H hint · N new deal',
  },
  es: {
    'menu.title': 'Pirámide',
    'board.label': 'Mesa de la pirámide',
    'info.passes': 'Vueltas {n}',
    'pile.tableau': 'Carta de la pirámide',
    'announce.draw': 'Se gira una carta del mazo.',
    'announce.recycle': 'El descarte vuelve al mazo.',
    'announce.pair': '{a} y {b} suman 13 y salen.',
    'announce.king': 'Sale {card}.',
    keys: 'Teclas: ←/→ carta · Intro elegir / emparejar · D robar · A quitar · U deshacer · H pista · N nueva partida',
  },
};
