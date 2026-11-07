import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Leduc Poker',
    'difficulty.easy.hint':
      'Bets only kings before the public card and pairs after it; calls too much.',
    'difficulty.medium.hint': 'Bets and raises by hand strength, with some bluffs.',
    'difficulty.hard.hint':
      'Plays a Nash equilibrium precomputed by CFR+ (288 situations): nobody can beat it in the long run.',
  },
  es: {
    title: 'Póker de Leduc',
    'difficulty.easy.hint':
      'Solo apuesta reyes antes de la carta pública y parejas después; paga demasiado.',
    'difficulty.medium.hint': 'Apuesta y sube según la fuerza de su mano, con algunos faroles.',
    'difficulty.hard.hint':
      'Juega un equilibrio de Nash precalculado con CFR+ (288 situaciones): nadie puede batirlo a la larga.',
  },
};
