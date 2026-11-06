import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Tablut',
    'menu.subtitle': 'The Lapland king makes for the edge of the board — can the raiders stop him?',
    'difficulty.easy.hint': 'Looks one move ahead, sometimes at random.',
    'difficulty.medium.hint': 'Reads two moves ahead.',
    'difficulty.hard.hint': 'A fast deep search for about a second.',
    'info.goal.0': 'Attackers: capture the king',
    'info.goal.1': 'Defenders: bring the king to any edge square',
  },
  es: {
    'menu.title': 'Tablut',
    'menu.subtitle':
      'El rey lapón corre hacia el borde del tablero: ¿podrán detenerlo los asaltantes?',
    'difficulty.easy.hint': 'Mira una jugada, a veces al azar.',
    'difficulty.medium.hint': 'Lee dos jugadas por delante.',
    'difficulty.hard.hint': 'Búsqueda rápida y profunda durante un segundo.',
    'info.goal.0': 'Atacantes: capturad al rey',
    'info.goal.1': 'Defensores: llevad al rey a cualquier casilla del borde',
  },
};
