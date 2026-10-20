/**
 * Reversi opponent: negamax with alpha-beta on a mutable board, positional weights (corners good,
 * X/C squares bad unless their corner is taken), mobility, iterative deepening under a time budget,
 * and exact endgame solving (maximizing the final disc difference) when few empties remain.
 * Opponent code only — the rules live in engine.ts.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import type { ReversiRules, ReversiState } from './engine';

const DIRS = [-1, 0, 1]
  .flatMap((dr) => [-1, 0, 1].map((dc) => [dr, dc] as const))
  .filter(([dr, dc]) => dr || dc);
const FINAL = 100_000;

class Timeout extends Error {}

export interface ReversiSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  /** Solve exactly when at most this many empty squares remain. */
  endgameEmpties: number;
  randomness?: number;
  now?: () => number;
}

/** Static square values for an n×n board. */
export function squareWeights(n: number): number[] {
  const w = new Array<number>(n * n).fill(-1);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const edgeR = r === 0 || r === n - 1;
      const edgeC = c === 0 || c === n - 1;
      const nearR = r === 1 || r === n - 2;
      const nearC = c === 1 || c === n - 2;
      let v = -1;
      if (edgeR && edgeC) v = 100;
      else if (nearR && nearC)
        v = -50; // X-square
      else if ((edgeR && nearC) || (edgeC && nearR))
        v = -20; // C-square
      else if (edgeR || edgeC) v = 8;
      else if (nearR || nearC) v = -2;
      w[r * n + c] = v;
    }
  }
  return w;
}

export class ReversiSearchAgent implements Agent<ReversiState, number> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private readonly n: number;
  private readonly weights: number[];
  /** For every X/C square, the corner it guards. */
  private readonly guardOf: number[];
  private nodes = 0;
  private deadline = Infinity;

  constructor(
    rules: ReversiRules,
    private readonly options: ReversiSearchOptions,
  ) {
    this.id = options.id;
    this.label = options.label;
    this.n = rules.size;
    this.weights = squareWeights(this.n);
    const n = this.n;
    const corners = [0, n - 1, n * (n - 1), n * n - 1];
    this.guardOf = Array.from({ length: n * n }, (_, i) => {
      if (this.weights[i]! >= -2) return -1;
      const r = Math.floor(i / n);
      const c = i % n;
      return (
        corners.find((k) => Math.abs(Math.floor(k / n) - r) <= 1 && Math.abs((k % n) - c) <= 1) ??
        -1
      );
    });
  }

  selectAction(
    env: GameEnvironment<ReversiState, number>,
    state: ReversiState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('ReversiSearchAgent: no legal actions');
    if (legal.length === 1) return this.finish(legal[0]!, 0, 0);
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return this.finish(ctx.rng.pick(legal), 0, 0);
    const board = Int8Array.from(state.board);
    const me = player === 0 ? 1 : 2;
    const now = this.options.now ?? (() => performance.now());
    const budget = ctx.timeLimitMs ?? this.options.timeLimitMs;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    const empties = board.reduce((k, v) => k + (v === 0 ? 1 : 0), 0);
    let order = this.ordered(ctx.rng.shuffle(legal));

    if (empties <= this.options.endgameEmpties) {
      try {
        const { move, value } = this.root(board, me, order, empties + 2, true);
        return this.finish(move, value, empties);
      } catch (error) {
        if (!(error instanceof Timeout)) throw error;
        // Not solvable in time: fall back to a short heuristic search with a fresh, smaller budget.
        this.deadline = now() + (budget ?? 300) / 2;
      }
    }
    let best = order[0]!;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        const { move, value, scores } = this.root(board, me, order, depth, false);
        best = move;
        bestValue = value;
        reached = depth;
        order = order.slice().sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
      } catch (error) {
        if (error instanceof Timeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }
    return this.finish(best, bestValue, reached);
  }

  private finish(move: number, value: number, depth: number): number {
    this.lastStats = { nodes: this.nodes, depth, value };
    return move;
  }

  private ordered(moves: number[]): number[] {
    return moves.slice().sort((a, b) => (this.weights[b] ?? 0) - (this.weights[a] ?? 0));
  }

  private root(board: Int8Array, me: number, order: number[], depth: number, exact: boolean) {
    const pass = this.n * this.n;
    let alpha = -Infinity;
    let move = order[0]!;
    const scores = new Map<number, number>();
    for (const m of order) {
      let value: number;
      if (m === pass)
        value = -this.negamax(board, 3 - me, depth - 1, -Infinity, -alpha, true, exact);
      else {
        const flips = this.flips(board, m, me);
        this.apply(board, m, flips, me);
        value = -this.negamax(board, 3 - me, depth - 1, -Infinity, -alpha, false, exact);
        this.revert(board, m, flips, me);
      }
      scores.set(m, value);
      if (value > alpha) {
        alpha = value;
        move = m;
      }
    }
    return { move, value: alpha, scores };
  }

  private flips(board: Int8Array, i: number, mark: number): number[] {
    if (board[i] !== 0) return [];
    const n = this.n;
    const opp = 3 - mark;
    const r = Math.floor(i / n);
    const c = i % n;
    const out: number[] = [];
    for (const [dr, dc] of DIRS) {
      let rr = r + dr;
      let cc = c + dc;
      const start = out.length;
      while (rr >= 0 && rr < n && cc >= 0 && cc < n && board[rr * n + cc] === opp) {
        out.push(rr * n + cc);
        rr += dr;
        cc += dc;
      }
      if (!(
        out.length > start &&
        rr >= 0 &&
        rr < n &&
        cc >= 0 &&
        cc < n &&
        board[rr * n + cc] === mark
      ))
        out.length = start;
    }
    return out;
  }

  private apply(board: Int8Array, i: number, flips: number[], mark: number) {
    board[i] = mark;
    for (const f of flips) board[f] = mark;
  }

  private revert(board: Int8Array, i: number, flips: number[], mark: number) {
    board[i] = 0;
    for (const f of flips) board[f] = 3 - mark;
  }

  private moves(board: Int8Array, mark: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < board.length; i++)
      if (board[i] === 0 && this.flips(board, i, mark).length) out.push(i);
    return out;
  }

  private evaluate(board: Int8Array, mark: number): number {
    const opp = 3 - mark;
    let positional = 0;
    for (let i = 0; i < board.length; i++) {
      const v = board[i];
      if (!v) continue;
      let w = this.weights[i]!;
      // X and C squares stop being a liability once their corner is occupied.
      const guard = this.guardOf[i]!;
      if (guard >= 0 && board[guard] !== 0) w = 2;
      positional += v === mark ? w : -w;
    }
    const mine = this.moves(board, mark).length;
    const theirs = this.moves(board, opp).length;
    const mobility = mine + theirs === 0 ? 0 : (100 * (mine - theirs)) / (mine + theirs);
    return positional + mobility * 1.5;
  }

  private negamax(
    board: Int8Array,
    mark: number,
    depth: number,
    alpha: number,
    beta: number,
    passed: boolean,
    exact: boolean,
  ): number {
    this.nodes++;
    if (
      (this.nodes & 1023) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
    const moves = this.moves(board, mark);
    if (moves.length === 0) {
      if (passed) {
        let diff = 0;
        for (const v of board) diff += v === mark ? 1 : v === 0 ? 0 : -1;
        return diff === 0 ? 0 : Math.sign(diff) * FINAL + diff;
      }
      return -this.negamax(board, 3 - mark, depth, -beta, -alpha, true, exact);
    }
    if (depth <= 0 && !exact) return this.evaluate(board, mark);
    let best = -Infinity;
    for (const m of this.ordered(moves)) {
      const flips = this.flips(board, m, mark);
      this.apply(board, m, flips, mark);
      const v = -this.negamax(board, 3 - mark, depth - 1, -beta, -alpha, false, exact);
      this.revert(board, m, flips, mark);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
}
