import type { GameEnvironment, PlayerId } from '../protocols/types';
import type { Agent, DecisionContext, DecisionStats } from './types';

/** Score of an immediate win at the root; wins found deeper score slightly less (prefer fast wins). */
export const WIN_SCORE = 100_000;
const WIN_THRESHOLD = WIN_SCORE - 10_000;
/** Heuristic evaluations are scaled into (-HEURISTIC_SCALE, HEURISTIC_SCALE). */
const HEURISTIC_SCALE = 1_000;

export interface AlphaBetaOptions<S, A> {
  id?: string;
  label?: string;
  /** Maximum search depth in plies. Use Infinity to search to terminal states. */
  maxDepth: number;
  /**
   * Heuristic value of a non-terminal leaf from `player`'s perspective, in [-1, 1].
   * Defaults to 0 (pure terminal search).
   */
  evaluate?: (env: GameEnvironment<S, A>, state: S, player: PlayerId) => number;
  /** Optional move ordering; better moves first improves pruning. */
  orderActions?: (state: S, actions: A[]) => A[];
  /** Iterative deepening stops starting new iterations after this budget. */
  timeLimitMs?: number;
  /** Use env.stateKey for a transposition table when available. Default true. */
  transpositions?: boolean;
  now?: () => number;
}

const enum Bound {
  Exact,
  Lower,
  Upper,
}

interface TableEntry {
  depth: number;
  value: number;
  bound: Bound;
}

class SearchTimeout extends Error {}

/**
 * Generic depth-limited minimax with alpha-beta pruning for two-player zero-sum games with perfect
 * information. Values are always computed from the root player's perspective, so games where a
 * player may move several times in a row (e.g. Dots and Boxes) are handled correctly.
 * Root moves are shuffled first, so the agent picks uniformly among equally good moves.
 */
export class AlphaBetaAgent<S, A> implements Agent<S, A> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;

  private nodes = 0;
  private deadline = Infinity;
  private table = new Map<string, TableEntry>();

  constructor(private readonly options: AlphaBetaOptions<S, A>) {
    this.id = options.id ?? `alphabeta-d${options.maxDepth}`;
    this.label = options.label ?? `Alpha-Beta (depth ${options.maxDepth})`;
  }

  selectAction(env: GameEnvironment<S, A>, state: S, player: PlayerId, ctx: DecisionContext): A {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('AlphaBetaAgent: no legal actions');
    const now = this.options.now ?? (() => performance.now());
    const budget = ctx.timeLimitMs ?? this.options.timeLimitMs;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    this.table.clear();

    let rootActions = ctx.rng.shuffle(legal);
    if (this.options.orderActions) rootActions = this.options.orderActions(state, rootActions);

    let best: A = rootActions[0] as A;
    let bestValue = -Infinity;
    let completedDepth = 0;
    const maxDepth = this.options.maxDepth;
    const iterative = budget !== undefined && Number.isFinite(maxDepth);
    const firstDepth = iterative ? 1 : maxDepth;

    for (let depth = firstDepth; depth <= maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        let iterationBest: A = rootActions[0] as A;
        let iterationValue = -Infinity;
        const scored: { action: A; value: number }[] = [];
        for (const action of rootActions) {
          const child = env.applyAction(state, action);
          const value = this.search(env, child, depth - 1, alpha, Infinity, player, 1, now);
          scored.push({ action, value });
          if (value > iterationValue) {
            iterationValue = value;
            iterationBest = action;
          }
          alpha = Math.max(alpha, value);
        }
        best = iterationBest;
        bestValue = iterationValue;
        completedDepth = depth;
        // Search the previous best first next iteration (stable to keep random tie order).
        rootActions = [iterationBest, ...rootActions.filter((a) => a !== iterationBest)];
        if (Math.abs(iterationValue) >= WIN_THRESHOLD) break;
        if (!Number.isFinite(depth)) break;
      } catch (error) {
        if (error instanceof SearchTimeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }

    this.lastStats = { nodes: this.nodes, depth: completedDepth, value: bestValue };
    return best;
  }

  private search(
    env: GameEnvironment<S, A>,
    state: S,
    depth: number,
    alpha: number,
    beta: number,
    root: PlayerId,
    ply: number,
    now: () => number,
  ): number {
    this.nodes++;
    if ((this.nodes & 1023) === 0 && now() > this.deadline) throw new SearchTimeout();

    if (env.isTerminal(state)) {
      const outcome = env.getOutcome(state);
      const ret = outcome?.returns[root] ?? 0;
      if (ret > 0) return WIN_SCORE - ply;
      if (ret < 0) return -WIN_SCORE + ply;
      return 0;
    }
    if (depth <= 0) {
      const h = this.options.evaluate?.(env, state, root) ?? 0;
      return Math.max(-1, Math.min(1, h)) * HEURISTIC_SCALE;
    }

    const useTable = this.options.transpositions !== false && env.stateKey !== undefined;
    const key = useTable ? env.stateKey!(state) : '';
    const alphaOrig = alpha;
    const betaOrig = beta;
    if (useTable) {
      const entry = this.table.get(key);
      if (entry && entry.depth >= depth) {
        const value = fromTable(entry.value, ply);
        if (entry.bound === Bound.Exact) return value;
        if (entry.bound === Bound.Lower) alpha = Math.max(alpha, value);
        else beta = Math.min(beta, value);
        if (alpha >= beta) return value;
      }
    }

    const mover = env.getCurrentPlayer(state);
    let actions = env.getLegalActions(state, mover);
    if (this.options.orderActions) actions = this.options.orderActions(state, actions);
    const maximizing = mover === root;
    let best = maximizing ? -Infinity : Infinity;
    for (const action of actions) {
      const value = this.search(
        env,
        env.applyAction(state, action),
        depth - 1,
        alpha,
        beta,
        root,
        ply + 1,
        now,
      );
      if (maximizing) {
        if (value > best) best = value;
        if (best > alpha) alpha = best;
      } else {
        if (value < best) best = value;
        if (best < beta) beta = best;
      }
      if (alpha >= beta) break;
    }

    if (useTable) {
      const bound = best <= alphaOrig ? Bound.Upper : best >= betaOrig ? Bound.Lower : Bound.Exact;
      this.table.set(key, { depth, value: toTable(best, ply), bound });
    }
    return best;
  }
}

// Win scores depend on distance from the root; store them relative to the node instead.
function toTable(value: number, ply: number): number {
  if (value >= WIN_THRESHOLD) return value + ply;
  if (value <= -WIN_THRESHOLD) return value - ply;
  return value;
}

function fromTable(value: number, ply: number): number {
  if (value >= WIN_THRESHOLD) return value - ply;
  if (value <= -WIN_THRESHOLD) return value + ply;
  return value;
}
