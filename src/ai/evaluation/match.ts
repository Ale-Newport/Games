import { Rng } from '../../core/game-engine/random';
import type { Agent } from '../agents/types';
import { sampleChanceAction } from '../agents/mcts-agent';
import { CHANCE_PLAYER, type GameEnvironment, type Outcome } from '../protocols/types';

export interface MatchResult<A> {
  outcome: Outcome | null;
  /** True when the step limit was reached before a terminal state. */
  truncated: boolean;
  actions: A[];
  /** Per-seat decision latency samples in milliseconds. */
  latencies: number[][];
  /** Per-seat search node counts reported by agents. */
  nodes: number[][];
}

export interface MatchOptions<C> {
  seed: number;
  config?: C;
  maxSteps?: number;
  timeLimitMs?: number;
  now?: () => number;
}

/** Plays one game between agents (agents[i] controls seat i). Chance events use the match seed. */
export function playMatch<S, A, C>(
  env: GameEnvironment<S, A, unknown, C>,
  agents: readonly Agent<S, A>[],
  options: MatchOptions<C>,
): MatchResult<A> {
  const now = options.now ?? (() => performance.now());
  const rng = new Rng(options.seed);
  const chanceRng = new Rng(options.seed ^ 0x5bd1e995);
  let state = env.createInitialState(options.config, options.seed);
  const actions: A[] = [];
  const latencies = agents.map(() => [] as number[]);
  const nodes = agents.map(() => [] as number[]);
  const maxSteps = options.maxSteps ?? 10_000;

  for (let step = 0; step < maxSteps && !env.isTerminal(state); step++) {
    const seat = env.getCurrentPlayer(state);
    let action: A;
    if (seat === CHANCE_PLAYER) {
      action = sampleChanceAction(env, state, chanceRng);
    } else {
      const agent = agents[seat];
      if (!agent) throw new Error(`playMatch: no agent for seat ${seat}`);
      const start = now();
      action = agent.selectAction(env, state, seat, { rng, timeLimitMs: options.timeLimitMs });
      latencies[seat]?.push(now() - start);
      if (agent.lastStats?.nodes !== undefined) nodes[seat]?.push(agent.lastStats.nodes);
    }
    actions.push(action);
    state = env.applyAction(state, action);
  }

  const terminal = env.isTerminal(state);
  return {
    outcome: terminal ? env.getOutcome(state) : null,
    truncated: !terminal,
    actions,
    latencies,
    nodes,
  };
}
