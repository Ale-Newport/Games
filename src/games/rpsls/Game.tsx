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
  n: 5,
  prefix: 'r5',
  icons: ['rock', 'wizard', 'paper', 'lizard', 'scissors'],
  names: {
    en: ['Rock', 'Wizard', 'Paper', 'Lizard', 'Scissors'],
    es: ['Piedra', 'Mago', 'Papel', 'Lagarto', 'Tijera'],
  },
  verbs: {
    en: {
      '1-0': 'The wizard melts the rock',
      '1-4': 'The wizard enchants the scissors',
      '2-1': 'Paper binds the wizard in a scroll',
      '2-0': 'Paper covers rock',
      '3-2': 'The lizard eats the paper',
      '3-1': 'The lizard bites the wizard',
      '4-3': 'Scissors snip the lizard’s tail',
      '4-2': 'Scissors cut paper',
      '0-4': 'Rock crushes scissors',
      '0-3': 'Rock squashes the lizard',
    },
    es: {
      '1-0': 'El mago derrite la piedra',
      '1-4': 'El mago hechiza la tijera',
      '2-1': 'El papel encierra al mago en un pergamino',
      '2-0': 'El papel envuelve la piedra',
      '3-2': 'El lagarto se come el papel',
      '3-1': 'El lagarto muerde al mago',
      '4-3': 'La tijera le corta la cola al lagarto',
      '4-2': 'La tijera corta el papel',
      '0-4': 'La piedra rompe la tijera',
      '0-3': 'La piedra aplasta al lagarto',
    },
  },
  strings: {
    en: {
      title: 'Rock Paper Scissors Lizard Wizard',
      'menu.subtitle':
        'Five throws, each beating two and losing to two: rock, paper, scissors, a lizard and a wizard. Fewer ties, more to read — and a computer that learns your habits.',
    },
    es: {
      title: 'Piedra, papel, tijera, lagarto o mago',
      'menu.subtitle':
        'Cinco jugadas, cada una vence a dos y pierde contra dos: piedra, papel, tijera, un lagarto y un mago. Menos empates, más que leer, y un ordenador que aprende tus costumbres.',
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
