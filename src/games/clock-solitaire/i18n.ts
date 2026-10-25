import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Clock',
    'board.label': 'Clock patience',
    'stat.score': 'Face up',
    'pile.stock': 'Pile to turn',
    'pile.tableau': 'Hour pile',
    'pile.waste': 'Card in hand',
    'info.kings': 'Kings {k}/4',
    'announce.turn': 'Turned the {card}.',
    'announce.place': 'The {card} goes under its hour.',
    keys: 'Keys: D turn the next card · A place it · U undo · N new deal',
  },
  es: {
    'menu.title': 'Reloj',
    'board.label': 'Solitario del reloj',
    'stat.score': 'Boca arriba',
    'pile.stock': 'Montón para girar',
    'pile.tableau': 'Montón de la hora',
    'pile.waste': 'Carta en la mano',
    'info.kings': 'Reyes {k}/4',
    'announce.turn': 'Girada: {card}.',
    'announce.place': '{card} va bajo su hora.',
    keys: 'Teclas: D girar la siguiente carta · A colocarla · U deshacer · N nueva partida',
  },
};
