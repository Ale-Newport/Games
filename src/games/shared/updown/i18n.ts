import type { Dictionary, Locale } from '../../../core/i18n';

/** Strings shared by the up-or-down solitaires. */
export const UPDOWN_STRINGS: Record<Locale, Dictionary> = {
  en: {
    'pile.tableau': 'Card',
    'info.run': 'Run {run} · Stock {n}',
    'info.stock': 'Stock {n}',
    'announce.draw': 'New waste card: the {card}.',
    'announce.play': 'The {card} goes onto the waste.',
    keys: 'Keys: ←/→ card · Enter play · D draw · U undo · H hint · N new deal',
  },
  es: {
    'pile.tableau': 'Carta',
    'info.run': 'Racha {run} · Mazo {n}',
    'info.stock': 'Mazo {n}',
    'announce.draw': 'Nueva carta en el descarte: {card}.',
    'announce.play': 'Al descarte: {card}.',
    keys: 'Teclas: ←/→ carta · Intro jugar · D robar · U deshacer · H pista · N nueva partida',
  },
};
