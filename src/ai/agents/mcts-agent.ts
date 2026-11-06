import { CHANCE_PLAYER, type GameEnvironment, type PlayerId } from '../protocols/types';
import type { Agent, DecisionContext, DecisionStats } from './types';
import type { Rng } from '../../core/game-engine/random';

export interface MctsOptions {
  id?: string;
  label?: string;
  /** Simulations per decision (upper bound when a time limit is also set). */
  iterations: number;
  timeLimitMs?: number;
  /** UCT exploration constant. */
  exploration?: number;
  /** Rollouts longer than this are scored as draws (all-zero returns). */
  maxRolloutSteps?: number;
  now?: () => number;
}

interface Node<S, A> {
  state: S;
  /** Player to act in `state` (or CHANCE_PLAYER). */
  mover: PlayerId;
  parent: Node<S, A> | null;
  action: A | null;
  children: Node<S, A>[];
  untried: A[];
  visits: number;
  /** Sum of returns for the player who chose the action leading here. */
  value: number;
}

/**
 * Upper Confidence bounds applied to Trees (UCT) with uniformly random rollouts.
 * Supports any number of players and chance nodes (sampled from getChanceOutcomes, or uniformly).
 * Perfect-information only: hidden-information games need determinization (see docs).
 */
export class MctsAgent<S, A> implements Agent<S, A> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;

  constructor(private readonly options: MctsOptions) {
    this.id = options.id ?? `mcts-${options.iterations}`;
    this.label = options.label ?? `MCTS (${options.iterations} simulations)`;
  }

  selectAction(env: GameEnvironment<S, A>, state: S, player: PlayerId, ctx: DecisionContext): A {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('MctsAgent: no legal actions');
    if (legal.length === 1) {
      this.lastStats = { nodes: 0 };
      return legal[0] as A;
    }
    const now = this.options.now ?? (() => performance.now());
    const budget = ctx.timeLimitMs ?? this.options.timeLimitMs;
    const deadline = budget === undefined ? Infinity : now() + budget;
    const c = this.options.exploration ?? Math.SQRT2;
    const root = this.makeNode(env, state, null, null, ctx.rng);

    let iterations = 0;
    while (iterations < this.options.iterations && now() < deadline) {
      iterations++;
      let node = root;
      // Selection
      while (node.untried.length === 0 && node.children.length > 0) {
        node =
          node.mover === CHANCE_PLAYER ? this.sampleChance(env, node, ctx.rng) : selectUct(node, c);
      }
      // Expansion
      if (node.untried.length > 0 && !env.isTerminal(node.state)) {
        const action = node.untried.pop() as A;
        const child = this.makeNode(
          env,
          env.applyAction(node.state, action),
          node,
          action,
          ctx.rng,
        );
        node.children.push(child);
        node = child;
      }
      // Simulation
      const returns = this.rollout(env, node.state, ctx.rng);
      // Backpropagation
      for (let n: Node<S, A> | null = node; n; n = n.parent) {
        n.visits++;
        const chooser = n.parent?.mover;
        if (chooser !== undefined && chooser >= 0) n.value += returns[chooser] ?? 0;
      }
    }

    let best = root.children[0];
    for (const child of root.children) {
      if (!best || child.visits > best.visits) best = child;
    }
    this.lastStats = {
      nodes: iterations,
      value: best && best.visits > 0 ? best.value / best.visits : 0,
    };
    return (best?.action ?? ctx.rng.pick(legal)) as A;
  }

  private makeNode(
    env: GameEnvironment<S, A>,
    state: S,
    parent: Node<S, A> | null,
    action: A | null,
    rng: Rng,
  ): Node<S, A> {
    const terminal = env.isTerminal(state);
    const mover = terminal ? -2 : env.getCurrentPlayer(state);
    const untried =
      terminal || mover === CHANCE_PLAYER ? [] : rng.shuffle(env.getLegalActions(state, mover));
    return { state, mover, parent, action, children: [], untried, visits: 0, value: 0 };
  }

  private sampleChance(env: GameEnvironment<S, A>, node: Node<S, A>, rng: Rng): Node<S, A> {
    const action = sampleChanceAction(env, node.state, rng);
    const child = this.makeNode(env, env.applyAction(node.state, action), node, action, rng);
    // Chance children are resampled each visit; keep the tree from growing unbounded.
    node.children = [child];
    return child;
  }

  private rollout(env: GameEnvironment<S, A>, start: S, rng: Rng): readonly number[] {
    let state = start;
    const limit = this.options.maxRolloutSteps ?? 1_000;
    for (let step = 0; step < limit && !env.isTerminal(state); step++) {
      const mover = env.getCurrentPlayer(state);
      const action =
        mover === CHANCE_PLAYER
          ? sampleChanceAction(env, state, rng)
          : rng.pick(env.getLegalActions(state, mover));
      state = env.applyAction(state, action);
    }
    return env.getOutcome(state)?.returns ?? new Array<number>(env.info.maxPlayers).fill(0);
  }
}

function selectUct<S, A>(node: Node<S, A>, c: number): Node<S, A> {
  let best = node.children[0] as Node<S, A>;
  let bestScore = -Infinity;
  const logN = Math.log(Math.max(1, node.visits));
  for (const child of node.children) {
    const score =
      child.visits === 0
        ? Infinity
        : child.value / child.visits + c * Math.sqrt(logN / child.visits);
    if (score > bestScore) {
      bestScore = score;
      best = child;
    }
  }
  return best;
}

export function sampleChanceAction<S, A>(env: GameEnvironment<S, A>, state: S, rng: Rng): A {
  if (env.getChanceOutcomes) {
    const outcomes = env.getChanceOutcomes(state);
    let r = rng.float();
    for (const outcome of outcomes) {
      r -= outcome.probability;
      if (r < 0) return outcome.action;
    }
    return (outcomes[outcomes.length - 1] as { action: A }).action;
  }
  return rng.pick(env.getLegalActions(state, CHANCE_PLAYER));
}
