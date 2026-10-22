import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Cram',
    'menu.subtitle': 'Place dominoes any way you like — the last one to fit a domino wins.',
    'difficulty.easy.hint': 'Looks one move ahead, sometimes at random.',
    'difficulty.medium.hint': 'Reads four moves ahead with a parity count.',
    'difficulty.hard.hint': 'Deeper search for about a second.',
    'seat.0': 'Blue',
    'seat.1': 'Orange',
    'menu.name0': 'Blue player',
    'menu.name1': 'Orange player',
    'menu.agent0': 'Blue agent',
    'menu.agent1': 'Orange agent',
    'info.goal.0': 'Blue places a domino, either way',
    'info.goal.1': 'Orange places a domino, either way',
  },
  es: {
    'menu.title': 'Cram',
    'menu.subtitle': 'Coloca fichas como quieras: gana quien coloque la última.',
    'difficulty.easy.hint': 'Mira una jugada, a veces al azar.',
    'difficulty.medium.hint': 'Lee cuatro jugadas con un recuento de paridad.',
    'difficulty.hard.hint': 'Búsqueda más profunda durante un segundo.',
    'seat.0': 'Azul',
    'seat.1': 'Naranja',
    'menu.name0': 'Jugador azul',
    'menu.name1': 'Jugador naranja',
    'menu.agent0': 'Agente azul',
    'menu.agent1': 'Agente naranja',
    'info.goal.0': 'Azul coloca una ficha, en cualquier dirección',
    'info.goal.1': 'Naranja coloca una ficha, en cualquier dirección',
  },
};
