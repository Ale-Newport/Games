/**
 * Kuhn poker opponents. Hard plays a Nash equilibrium found by CFR+ over the whole game (twelve
 * information sets); against it no strategy can win in the long run, and the player who acts
 * first loses 1/18 of a chip a hand on average. Medium mixes value bets with occasional bluffs and
 * calls; Easy plays "honestly" — bets only kings and calls too often.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import { sampleIndex, solveCfr, type CfrGame, type CfrStrategy } from '../../ai/agents/cfr';
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { kuhnEnd, kuhnOptions, kuhnPot, type KuhnState } from './engine';

/** A history of one hand: the cards (player to act first, second) and the betting. */
export interface KuhnHistory {
  cards: [number, number] | null;
  betting: string[];
}

/** One hand of Kuhn poker as a CFR game; player 0 acts first. */
export const KUHN_GAME: CfrGame<KuhnHistory> = {
  root: () => ({ cards: null, betting: [] }),
  isChance: (h) => h.cards === null,
  chance: () => {
    const out: { next: KuhnHistory; p: number }[] = [];
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++)
        if (a !== b) out.push({ next: { cards: [a, b], betting: [] }, p: 1 / 6 });
    return out;
  },
  isTerminal: (h) => h.cards !== null && kuhnEnd(h.betting) !== null,
  utility: (h) => {
    const end = kuhnEnd(h.betting)!;
    const half = kuhnPot(h.betting) / 2;
    if (end === 'showdown') return h.cards![0] > h.cards![1] ? half : -half;
    // The player who folded acted last.
    const folder = (h.betting.length - 1) % 2;
    return folder === 0 ? -1 : 1;
  },
  player: (h) => (h.betting.length % 2) as 0 | 1,
  actions: (h) => kuhnOptions(h.betting),
  play: (h, a) => ({ cards: h.cards, betting: [...h.betting, a] }),
  infoKey: (h) => `${h.cards![h.betting.length % 2]}:${h.betting.join(',')}`,
};

let equilibrium: CfrStrategy | null = null;
/** The CFR+ equilibrium (computed once, in a few milliseconds). */
export function kuhnEquilibrium(): CfrStrategy {
  equilibrium ??= solveCfr(KUHN_GAME, 4000);
  return equilibrium;
}

/** Strategy table by information set "card:betting" (cards 0 J, 1 Q, 2 K). */
export type KuhnPolicy = (card: number, betting: readonly string[]) => number[];

export const nashPolicy: KuhnPolicy = (card, betting) =>
  kuhnEquilibrium()[`${card}:${betting.join(',')}`] ?? kuhnOptions(betting).map(() => 0.5);

/** Medium: value bets, some bluffs with the jack, some calls with the queen. */
export const mediumPolicy: KuhnPolicy = (card, betting) => {
  const seq = betting.join(',');
  if (seq === '') return card === 2 ? [0.3, 0.7] : card === 1 ? [1, 0] : [0.75, 0.25];
  if (seq === 'check') return card === 2 ? [0, 1] : card === 1 ? [1, 0] : [0.67, 0.33];
  // Facing a bet: [fold, call].
  return card === 2 ? [0, 1] : card === 1 ? [0.6, 0.4] : [1, 0];
};

/** Easy: bets only kings, never bluffs, calls with queens and sometimes jacks. */
export const easyPolicy: KuhnPolicy = (card, betting) => {
  const seq = betting.join(',');
  if (seq === '' || seq === 'check') return card === 2 ? [0, 1] : [1, 0];
  return card === 0 ? [0.8, 0.2] : [0, 1];
};

export class KuhnPolicyAgent implements Agent<KuhnState, string> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly policy: KuhnPolicy,
  ) {}
  selectAction(
    _env: GameEnvironment<KuhnState, string>,
    s: KuhnState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (s.result) return 'next';
    const options = kuhnOptions(s.betting);
    const probs = this.policy(s.cards[s.toAct as 0 | 1], s.betting);
    return options[sampleIndex(probs, ctx.rng)]!;
  }
}

export const AGENT_PRESETS: AgentPreset<KuhnState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal action.', es: 'Cualquier acción legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Bets only with a king, never bluffs, calls too often.',
      es: 'Solo apuesta con el rey, nunca farolea y paga demasiado.',
    },
    create: () => new KuhnPolicyAgent('easy', 'Easy', easyPolicy),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Value bets, bluffs a jack now and then, calls some queens.',
      es: 'Apuesta por valor, farolea a veces con la jota y paga algunas damas.',
    },
    create: () => new KuhnPolicyAgent('medium', 'Medium', mediumPolicy),
  },
  {
    id: 'hard',
    kind: 'solver',
    label: { en: 'Hard (Nash)', es: 'Difícil (Nash)' },
    description: {
      en: 'A Nash equilibrium computed by CFR+: impossible to beat in the long run.',
      es: 'Un equilibrio de Nash calculado con CFR+: imposible de batir a la larga.',
    },
    create: () => new KuhnPolicyAgent('hard', 'Hard', nashPolicy),
  },
];
