import type { Dictionary, Locale } from '../../core/i18n';

export const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'Kuhn Poker',
    'difficulty.easy.hint': 'Bets only with the king, never bluffs, calls too often.',
    'difficulty.medium.hint': 'Value bets, bluffs a jack now and then, calls some queens.',
    'difficulty.hard.hint':
      'Plays the Nash equilibrium found by CFR+: nobody can beat it in the long run (whoever acts first loses 1/18 of a chip a hand on average).',
  },
  es: {
    title: 'Póker de Kuhn',
    'difficulty.easy.hint': 'Solo apuesta con el rey, nunca farolea y paga demasiado.',
    'difficulty.medium.hint':
      'Apuesta por valor, farolea a veces con la jota y paga algunas damas.',
    'difficulty.hard.hint':
      'Juega el equilibrio de Nash calculado con CFR+: nadie puede batirlo a la larga (quien habla primero pierde 1/18 de ficha por mano de media).',
  },
};
