import type { GameProps } from '../../core/game-engine/types';
import type { Duel } from '../shared/throws/engine';
import { outcome } from '../shared/throws/engine';
import { ThrowTable, type ThrowVariant } from '../shared/throws/ThrowTable';

/** The longest run of rounds won by seat 0. */
function bestStreak(g: Duel): number {
  let best = 0;
  let run = 0;
  for (const r of g.rounds) {
    const o = outcome(g.n, r.a, r.b);
    if (o > 0) best = Math.max(best, ++run);
    else if (o < 0) run = 0;
  }
  return best;
}

const VARIANT: ThrowVariant = {
  n: 3,
  prefix: 'rp',
  icons: ['rock', 'paper', 'scissors'],
  names: { en: ['Rock', 'Paper', 'Scissors'], es: ['Piedra', 'Papel', 'Tijera'] },
  verbs: {
    en: { '1-0': 'Paper covers rock', '2-1': 'Scissors cut paper', '0-2': 'Rock crushes scissors' },
    es: {
      '1-0': 'El papel envuelve la piedra',
      '2-1': 'La tijera corta el papel',
      '0-2': 'La piedra rompe la tijera',
    },
  },
  strings: {
    en: {
      title: 'Rock Paper Scissors',
      'menu.subtitle':
        'The oldest duel there is: throw rock, paper or scissors at the same time as the computer — and find out how predictable you are. Its best reader learns your habits as you play.',
    },
    es: {
      title: 'Piedra, papel o tijera',
      'menu.subtitle':
        'El duelo más antiguo: saca piedra, papel o tijera a la vez que el ordenador y descubre lo predecible que eres. Su mejor lector aprende tus costumbres mientras juegas.',
    },
  },
  onMatchEnd: (g, level, unlock) => {
    if (bestStreak(g) >= 5) unlock('streak');
    if (g.winner !== 0) return;
    unlock('first');
    if (level === 'meta') unlock('mind');
    if (g.wins[1] === 0) unlock('shutout');
  },
};

export function Game({ services }: GameProps) {
  return <ThrowTable services={services} variant={VARIANT} />;
}
