import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Domineering',
    'menu.subtitle':
      'Blue places dominoes up and down, Orange side to side — the last to fit one wins.',
    'difficulty.easy.hint': 'Looks one move ahead, sometimes at random.',
    'difficulty.medium.hint': 'Counts its moves against yours two plies ahead.',
    'difficulty.hard.hint': 'Deeper search for about a second.',
    'seat.0': 'Blue (vertical)',
    'seat.1': 'Orange (horizontal)',
    'menu.name0': 'Vertical player',
    'menu.name1': 'Horizontal player',
    'menu.agent0': 'Vertical agent',
    'menu.agent1': 'Horizontal agent',
    'info.goal.0': 'Blue places a vertical domino',
    'info.goal.1': 'Orange places a horizontal domino',
  },
  es: {
    'menu.title': 'Domineering',
    'menu.subtitle':
      'Azul coloca fichas en vertical y Naranja en horizontal: gana quien coloque la última.',
    'difficulty.easy.hint': 'Mira una jugada, a veces al azar.',
    'difficulty.medium.hint': 'Compara sus jugadas con las tuyas a dos jugadas vista.',
    'difficulty.hard.hint': 'Búsqueda más profunda durante un segundo.',
    'seat.0': 'Azul (vertical)',
    'seat.1': 'Naranja (horizontal)',
    'menu.name0': 'Jugador vertical',
    'menu.name1': 'Jugador horizontal',
    'menu.agent0': 'Agente vertical',
    'menu.agent1': 'Agente horizontal',
    'info.goal.0': 'Azul coloca una ficha vertical',
    'info.goal.1': 'Naranja coloca una ficha horizontal',
  },
};
