import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Hnefatafl',
    'menu.subtitle': 'Guide the king to a corner — or trap him with your raiders.',
    'difficulty.easy.hint': 'Looks one move ahead, sometimes at random.',
    'difficulty.medium.hint': 'Reads two moves ahead.',
    'difficulty.hard.hint': 'A fast deep search for about 1.5 s.',
    'info.goal.0': 'Attackers: surround the king on all four sides',
    'info.goal.1': 'Defenders: bring the king to a corner',
  },
  es: {
    'menu.title': 'Hnefatafl',
    'menu.subtitle': 'Lleva al rey a una esquina, o atrápalo con tus asaltantes.',
    'difficulty.easy.hint': 'Mira una jugada, a veces al azar.',
    'difficulty.medium.hint': 'Lee dos jugadas por delante.',
    'difficulty.hard.hint': 'Búsqueda rápida y profunda durante 1,5 s.',
    'info.goal.0': 'Atacantes: rodead al rey por los cuatro lados',
    'info.goal.1': 'Defensores: llevad al rey a una esquina',
  },
};
