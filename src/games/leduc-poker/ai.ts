/**
 * Leduc poker opponents. Nash plays the CFR+ equilibrium precomputed by `tools/solve-leduc.ts`
 * (288 information sets, in `strategy.ts`). Medium and Easy are hand-written mixed strategies:
 * Medium bets and raises by hand strength with some bluffs; Easy bets only strong hands and calls
 * too much.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import { sampleIndex } from '../../ai/agents/cfr';
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { leducOptions, rankOf, type LeducState } from './engine';
import { leducKey } from './cfr-game';
import { LEDUC_NASH } from './strategy';

/** A strategy: probabilities over `leducOptions` from what the player to act knows. */
export type LeducPolicy = (
  own: number,
  pub: number | null,
  betting: readonly (readonly string[])[],
) => number[];

const uniform = (betting: readonly (readonly string[])[]) => {
  const round = betting[1]!.length > 0 || isRoundTwo(betting) ? betting[1]! : betting[0]!;
  const n = leducOptions(round).length;
  return Array<number>(n).fill(1 / n);
};
/** Whether the first round's betting has finished. */
const isRoundTwo = (betting: readonly (readonly string[])[]) => {
  const r0 = betting[0]!;
  return r0[r0.length - 1] === 'call' || r0.join(' ') === 'check check';
};

export const nashPolicy: LeducPolicy = (own, pub, betting) =>
  LEDUC_NASH[leducKey(own, pub, betting)] ?? uniform(betting);

/** Facing-nothing, facing-a-bet and facing-a-raise mixes by strength class. */
type Mixes = { open: number; bet: [number, number, number]; raise: [number, number] };
const mixFor = (m: Mixes, round: readonly string[]) => {
  const seq = round.join(' ');
  if (seq === '' || seq === 'check') return [1 - m.open, m.open];
  if (seq.endsWith('raise')) return m.raise;
  return m.bet;
};

/** Strength class: 3 a pair with the board, else the rank (0 jack … 2 king). */
const classOf = (own: number, pub: number | null) =>
  pub !== null && rankOf(own) === rankOf(pub) ? 3 : rankOf(own);

const MEDIUM: Record<'pre' | 'post', Mixes[]> = {
  pre: [
    { open: 0.15, bet: [0.6, 0.35, 0.05], raise: [0.85, 0.15] },
    { open: 0.3, bet: [0.2, 0.75, 0.05], raise: [0.4, 0.6] },
    { open: 0.8, bet: [0, 0.4, 0.6], raise: [0, 1] },
  ],
  post: [
    { open: 0.1, bet: [0.85, 0.15, 0], raise: [0.95, 0.05] },
    { open: 0.2, bet: [0.55, 0.45, 0], raise: [0.8, 0.2] },
    { open: 0.5, bet: [0.25, 0.7, 0.05], raise: [0.5, 0.5] },
    { open: 0.9, bet: [0, 0.3, 0.7], raise: [0, 1] },
  ],
};

const EASY: Record<'pre' | 'post', Mixes[]> = {
  pre: [
    { open: 0, bet: [0.5, 0.5, 0], raise: [0.5, 0.5] },
    { open: 0, bet: [0, 1, 0], raise: [0, 1] },
    { open: 1, bet: [0, 0.5, 0.5], raise: [0, 1] },
  ],
  post: [
    { open: 0, bet: [0.6, 0.4, 0], raise: [0.6, 0.4] },
    { open: 0, bet: [0.3, 0.7, 0], raise: [0.3, 0.7] },
    { open: 0, bet: [0, 1, 0], raise: [0, 1] },
    { open: 1, bet: [0, 0, 1], raise: [0, 1] },
  ],
};

const tablePolicy =
  (table: Record<'pre' | 'post', Mixes[]>): LeducPolicy =>
  (own, pub, betting) => {
    const two = isRoundTwo(betting);
    const mixes = two ? table.post[classOf(own, pub)]! : table.pre[rankOf(own)]!;
    return mixFor(mixes, two ? betting[1]! : betting[0]!);
  };

export const mediumPolicy = tablePolicy(MEDIUM);
export const easyPolicy = tablePolicy(EASY);

/** What the player to act sees: its card, the public card once dealt, and the betting. */
export function decisionOf(s: LeducState): [number, number | null, LeducState['betting']] {
  const p = s.toAct as 0 | 1;
  return [s.cards[p], s.round === 1 ? s.cards[2] : null, s.betting];
}

export class LeducPolicyAgent implements Agent<LeducState, string> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly policy: LeducPolicy,
  ) {}
  selectAction(
    _env: GameEnvironment<LeducState, string>,
    s: LeducState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    if (s.result) return 'next';
    const options = leducOptions(s.betting[s.round]);
    return options[sampleIndex(this.policy(...decisionOf(s)), ctx.rng)]!;
  }
}

export const AGENT_PRESETS: AgentPreset<LeducState, string>[] = [
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
      en: 'Bets only kings before the flop and pairs after it; calls too much.',
      es: 'Solo apuesta reyes antes de la carta pública y parejas después; paga demasiado.',
    },
    create: () => new LeducPolicyAgent('easy', 'Easy', easyPolicy),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Bets and raises by hand strength, with some bluffs.',
      es: 'Apuesta y sube según la fuerza de su mano, con algunos faroles.',
    },
    create: () => new LeducPolicyAgent('medium', 'Medium', mediumPolicy),
  },
  {
    id: 'hard',
    kind: 'solver',
    label: { en: 'Hard (Nash)', es: 'Difícil (Nash)' },
    description: {
      en: 'A Nash equilibrium precomputed by CFR+: unbeatable in the long run.',
      es: 'Un equilibrio de Nash precalculado con CFR+: imbatible a la larga.',
    },
    create: () => new LeducPolicyAgent('hard', 'Hard', nashPolicy),
  },
];
