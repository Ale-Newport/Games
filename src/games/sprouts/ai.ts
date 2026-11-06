/**
 * Sprouts opponents: flat Monte Carlo. Candidate curves come from every joinable pair of spots
 * (and loops), routed a few times with random costs so different ways around obstacles — which
 * split the regions differently — are all considered. Each candidate is scored by random playouts
 * to the end of the game (random pairs, random routes); Hard spreads its playouts with UCB1 for
 * about 1.5 s.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import { EpsilonAgent, RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { applySproutsAction, buildGrid, joinable, regions, type SproutsState } from './engine';
import { route } from './route';

/** Distinct candidate curves for the side to move. */
export function candidateCurves(s: SproutsState, rng: Rng, perPair: number): string[] {
  const g = buildGrid(s);
  const ids = regions(g);
  const out = new Set<string>();
  for (const [a, b, region] of joinable(s, g))
    for (let i = 0; i < perPair; i++) {
      const path = route(s, a, b, region, i === 0 ? undefined : rng, g, ids);
      if (path) out.add(path.join('.'));
    }
  return [...out];
}

/** A random legal curve (random pair, random route). */
export function randomCurve(s: SproutsState, rng: Rng): string | null {
  const g = buildGrid(s);
  const ids = regions(g);
  const pairs = rng.shuffle(joinable(s, g));
  for (const [a, b, region] of pairs) {
    const path = route(s, a, b, region, rng, g, ids);
    if (path) return path.join('.');
  }
  return null;
}

function playout(s: SproutsState, rng: Rng): 0 | 1 {
  let state = s;
  while (!state.result) {
    const curve = randomCurve(state, rng);
    if (!curve) return (1 - state.toMove) as 0 | 1;
    state = applySproutsAction(state, curve);
  }
  return state.result.winner;
}

export class SproutsMcAgent implements Agent<SproutsState, string> {
  lastStats?: DecisionStats;

  constructor(
    readonly id: string,
    readonly label: string,
    private readonly o: {
      playouts?: number;
      timeLimitMs?: number;
      perPair: number;
      now?: () => number;
    },
  ) {}

  selectAction(
    env: GameEnvironment<SproutsState, string>,
    state: SproutsState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const candidates = candidateCurves(state, ctx.rng, this.o.perPair);
    if (candidates.length === 0) return env.getLegalActions(state, player)[0]!;
    const me = state.toMove;
    const children = candidates.map((c) => applySproutsAction(state, c));
    // An immediate win (the opponent is left without a curve) needs no playouts.
    const winning = children.findIndex((c) => c.result?.winner === me);
    if (winning >= 0) return candidates[winning]!;
    const wins = new Float64Array(candidates.length);
    const visits = new Float64Array(candidates.length);
    const now = this.o.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.o.timeLimitMs].filter((n) => n !== undefined);
    const deadline = limits.length ? now() + Math.min(...limits) : Infinity;
    const budget = this.o.playouts ?? Infinity;
    let total = 0;
    while (total < budget * candidates.length && (total === 0 || now() < deadline)) {
      // UCB1 over the candidates; every candidate is tried once first.
      let pick = total < candidates.length ? total : 0;
      if (total >= candidates.length) {
        let best = -Infinity;
        for (let i = 0; i < candidates.length; i++) {
          const ucb = wins[i]! / visits[i]! + Math.sqrt((2 * Math.log(total)) / visits[i]!);
          if (ucb > best) {
            best = ucb;
            pick = i;
          }
        }
      }
      const child = children[pick]!;
      const winner = child.result ? child.result.winner : playout(child, ctx.rng);
      visits[pick]!++;
      if (winner === me) wins[pick]!++;
      total++;
    }
    let bestIndex = 0;
    for (let i = 1; i < candidates.length; i++)
      if (wins[i]! / visits[i]! > wins[bestIndex]! / visits[bestIndex]!) bestIndex = i;
    this.lastStats = {
      nodes: total,
      depth: 0,
      value: wins[bestIndex]! / Math.max(1, visits[bestIndex]!),
    };
    return candidates[bestIndex]!;
  }
}

/** Random legal curves, for the Random preset (the environment cannot list every curve). */
class RandomCurveAgent extends RandomAgent<SproutsState, string> {
  override selectAction(
    env: GameEnvironment<SproutsState, string>,
    state: SproutsState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    return randomCurve(state, ctx.rng) ?? super.selectAction(env, state, player, ctx);
  }
}

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS: AgentPreset<SproutsState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Draws any legal curve.', es: 'Traza cualquier curva legal.' },
    create: () => new RandomCurveAgent(),
  },
  {
    id: 'easy',
    kind: 'mcts',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'A few random playouts per curve; a random curve 30% of the time.',
      es: 'Pocas simulaciones por curva; curva al azar el 30% de las veces.',
    },
    create: () =>
      new EpsilonAgent(
        new SproutsMcAgent('easy-core', 'Easy core', { playouts: 3, perPair: 1 }),
        0.3,
        {
          id: 'easy',
          label: 'Easy',
        },
      ),
  },
  {
    id: 'medium',
    kind: 'mcts',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Fifteen random playouts for each candidate curve.',
      es: 'Quince simulaciones para cada curva candidata.',
    },
    create: () => new SproutsMcAgent('medium', 'Medium', { playouts: 15, perPair: 1 }),
  },
  {
    id: 'hard',
    kind: 'mcts',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Several routes per pair and playouts for about 1.5 s.',
      es: 'Varias rutas por pareja y simulaciones durante 1,5 s.',
    },
    create: () =>
      new SproutsMcAgent('hard', 'Hard', { playouts: 90, perPair: 2, timeLimitMs: 4000 }),
  },
];
