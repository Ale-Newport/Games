import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    'menu.title': 'Congkak',
    'menu.subtitle': 'Seven houses, seven seeds — keep sowing from every pit you land in.',
    'difficulty.easy.hint': 'Looks two moves ahead, sometimes at random.',
    'difficulty.medium.hint': 'Reads three moves ahead.',
    'difficulty.hard.hint': 'Deeper search for about a second.',
    'info.goal': 'Collect the most seeds in your store',
  },
  es: {
    'menu.title': 'Congkak',
    'menu.subtitle':
      'Siete casas, siete semillas: sigue sembrando desde cada casa en la que caigas.',
    'difficulty.easy.hint': 'Mira dos jugadas, a veces al azar.',
    'difficulty.medium.hint': 'Lee tres jugadas por delante.',
    'difficulty.hard.hint': 'Búsqueda más profunda durante un segundo.',
    'info.goal': 'Reúne más semillas en tu almacén',
  },
};
