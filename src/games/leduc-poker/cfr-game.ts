/** One hand of Leduc poker as a CFR game (player 0 acts first in both rounds). */
import type { CfrGame } from '../../ai/agents/cfr';
import { BET_SIZES, leducOptions, leducStrength, rankOf, roundEnd } from './engine';

export interface LeducHistory {
  cards: [number, number, number] | null;
  round: 0 | 1;
  betting: [string[], string[]];
}

/** Chips each seat has put in after a betting history (antes included). */
export function paidAfter(betting: readonly (readonly string[])[]): [number, number] {
  const paid: [number, number] = [1, 1];
  betting.forEach((round, r) =>
    round.forEach((a, k) => {
      const p = k % 2;
      const owe = paid[1 - p]! - paid[p]!;
      paid[p]! +=
        a === 'call' ? owe : a === 'bet' ? BET_SIZES[r]! : a === 'raise' ? owe + BET_SIZES[r]! : 0;
    }),
  );
  return paid;
}

/** The information set key: own rank, the public rank once shown, and the betting. */
export const leducKey = (
  own: number,
  pub: number | null,
  betting: readonly (readonly string[])[],
) =>
  `${rankOf(own)}${pub === null ? '-' : rankOf(pub)}:${betting[0]!.join(',')}/${betting[1]!.join(',')}`;

export const LEDUC_GAME: CfrGame<LeducHistory> = {
  root: () => ({ cards: null, round: 0, betting: [[], []] }),
  isChance: (h) => h.cards === null,
  chance: () => {
    const out: { next: LeducHistory; p: number }[] = [];
    for (let a = 0; a < 6; a++)
      for (let b = 0; b < 6; b++)
        for (let c = 0; c < 6; c++)
          if (a !== b && a !== c && b !== c)
            out.push({ next: { cards: [a, b, c], round: 0, betting: [[], []] }, p: 1 / 120 });
    return out;
  },
  isTerminal: (h) => {
    if (h.cards === null) return false;
    const end = roundEnd(h.betting[h.round]);
    return end === 'fold' || (end === 'done' && h.round === 1);
  },
  utility: (h) => {
    const paid = paidAfter(h.betting);
    const round = h.betting[h.round];
    if (roundEnd(round) === 'fold') {
      const folder = (round.length - 1) % 2;
      return folder === 0 ? -paid[0] : paid[1];
    }
    const [a, b] = [
      leducStrength(h.cards![0], h.cards![2]),
      leducStrength(h.cards![1], h.cards![2]),
    ];
    return a > b ? paid[1] : a < b ? -paid[0] : 0;
  },
  player: (h) => (h.betting[h.round].length % 2) as 0 | 1,
  actions: (h) => leducOptions(h.betting[h.round]),
  play: (h, a) => {
    const betting: [string[], string[]] = [[...h.betting[0]], [...h.betting[1]]];
    betting[h.round].push(a);
    const round = h.round === 0 && roundEnd(betting[0]) === 'done' ? 1 : h.round;
    return { cards: h.cards, round, betting };
  },
  infoKey: (h) => {
    const p = h.betting[h.round].length % 2;
    return leducKey(h.cards![p]!, h.round === 1 ? h.cards![2] : null, h.betting);
  },
};
