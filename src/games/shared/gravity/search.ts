/**
 * Fast negamax search for gravity line games (Four in a Row, Connect Five Gravity).
 * Uses a mutable board with make/unmake, Zobrist hashing, a transposition table, center-out move
 * ordering with the previous best move first, immediate-win/forced-block detection and iterative
 * deepening under a time budget. This is opponent code only; the rules live in engine.ts.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { allLines } from '../../../core/game-engine/grid';
import { Rng } from '../../../core/game-engine/random';
import type { GravityRules, GravityState } from './engine';

const WIN = 1_000_000;
const WIN_THRESHOLD = WIN - 10_000;

const enum Flag {
  Exact,
  Lower,
  Upper,
}

interface Entry {
  depth: number;
  value: number;
  flag: Flag;
  best: number;
}

class Timeout extends Error {}

export interface GravitySearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  /** Per-move time budget for iterative deepening. */
  timeLimitMs?: number;
  /** Probability of playing a uniformly random legal move instead (difficulty tuning). */
  randomness?: number;
  now?: () => number;
}

export class GravitySearchAgent implements Agent<GravityState, number> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;

  private readonly rows: number;
  private readonly cols: number;
  private readonly cells: number;
  private readonly linesByCell: Int16Array[][];
  private readonly lines: Int16Array[];
  private readonly weights: number[];
  private readonly centerOrder: number[];
  private readonly zobrist: Uint32Array[];
  private board!: Int8Array;
  private heights!: Int8Array;
  private moves = 0;
  private hashHi = 0;
  private hashLo = 0;
  private nodes = 0;
  private deadline = Infinity;
  private readonly table = new Map<number, Entry>();

  constructor(
    rules: GravityRules,
    private readonly options: GravitySearchOptions,
  ) {
    this.id = options.id;
    this.label = options.label;
    this.rows = rules.rows;
    this.cols = rules.cols;
    this.cells = rules.rows * rules.cols;
    this.lines = allLines(rules, rules.k).map((l) => Int16Array.from(l));
    this.linesByCell = Array.from({ length: this.cells }, (_, c) =>
      this.lines.filter((l) => l.includes(c)),
    );
    this.weights = Array.from({ length: rules.k }, (_, n) =>
      n === 0 ? 0 : 5 ** (n - 1) * (n === rules.k - 1 ? 2 : 1),
    );
    const mid = (this.cols - 1) / 2;
    this.centerOrder = Array.from({ length: this.cols }, (_, c) => c).sort(
      (a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b,
    );
    const rng = new Rng(0x5eed + this.cells);
    this.zobrist = [0, 1, 2, 3].map(() =>
      Uint32Array.from({ length: this.cells * 2 }, () => rng.uint32()),
    );
  }

  selectAction(
    env: GameEnvironment<GravityState, number>,
    state: GravityState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('GravitySearchAgent: no legal moves');
    if (this.options.randomness && ctx.rng.chance(this.options.randomness)) {
      this.lastStats = { nodes: 0, depth: 0 };
      return ctx.rng.pick(legal);
    }
    this.load(state);
    const now = this.options.now ?? (() => performance.now());
    const budget = ctx.timeLimitMs ?? this.options.timeLimitMs;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    this.table.clear();
    const mark = player === 0 ? 1 : 2;

    // Immediate win, then forced block.
    for (const col of legal) if (this.wouldWin(col, mark)) return this.finish(col, WIN, 1);
    const threats = legal.filter((col) => this.wouldWin(col, 3 - mark));
    if (threats.length === 1) return this.finish(threats[0]!, 0, 1);

    let rootOrder = ctx.rng
      .shuffle(legal)
      .sort((a, b) => this.centerOrder.indexOf(a) - this.centerOrder.indexOf(b));
    let best = rootOrder[0]!;
    let bestValue = -Infinity;
    let completed = 0;
    const maxDepth = Math.min(this.options.maxDepth, this.cells - this.moves);
    for (let depth = 1; depth <= maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        let iterationBest = rootOrder[0]!;
        const scores = new Map<number, number>();
        for (const col of rootOrder) {
          this.make(col, mark);
          const value = this.isWinAt(this.lastIndex(col), mark)
            ? WIN - 1
            : -this.negamax(depth - 1, -Infinity, -alpha, 1, 3 - mark);
          this.unmake(col, mark);
          scores.set(col, value);
          if (value > alpha) {
            alpha = value;
            iterationBest = col;
          }
        }
        best = iterationBest;
        bestValue = alpha;
        completed = depth;
        rootOrder = rootOrder.slice().sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
        if (Math.abs(alpha) >= WIN_THRESHOLD) break;
      } catch (error) {
        if (error instanceof Timeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }
    return this.finish(best, bestValue, completed);
  }

  private finish(col: number, value: number, depth: number): number {
    this.lastStats = { nodes: this.nodes, depth, value };
    return col;
  }

  private load(state: GravityState) {
    this.board = Int8Array.from(state.board);
    this.heights = Int8Array.from(state.heights);
    this.moves = state.history.length;
    this.hashHi = 0;
    this.hashLo = 0;
    for (let i = 0; i < this.cells; i++) {
      const v = this.board[i]!;
      if (v) this.toggleHash(i, v);
    }
  }

  private toggleHash(index: number, mark: number) {
    const slot = index * 2 + mark - 1;
    this.hashHi ^= this.zobrist[0]![slot]!;
    this.hashLo ^= this.zobrist[1]![slot]!;
  }

  private key(mark: number): number {
    // 21 high bits + 32 low bits fit exactly in a double; the side to move is folded in.
    return ((this.hashHi >>> 11) ^ (mark === 1 ? 0 : 0x1fffff)) * 4294967296 + (this.hashLo >>> 0);
  }

  private lastIndex(col: number): number {
    return (this.rows - this.heights[col]!) * this.cols + col;
  }

  private make(col: number, mark: number) {
    const index = (this.rows - 1 - this.heights[col]!) * this.cols + col;
    this.board[index] = mark;
    this.heights[col]!++;
    this.moves++;
    this.toggleHash(index, mark);
  }

  private unmake(col: number, mark: number) {
    this.heights[col]!--;
    const index = (this.rows - 1 - this.heights[col]!) * this.cols + col;
    this.board[index] = 0;
    this.moves--;
    this.toggleHash(index, mark);
  }

  private isWinAt(index: number, mark: number): boolean {
    for (const line of this.linesByCell[index]!) {
      let all = true;
      for (let i = 0; i < line.length; i++) {
        if (this.board[line[i]!] !== mark) {
          all = false;
          break;
        }
      }
      if (all) return true;
    }
    return false;
  }

  private wouldWin(col: number, mark: number): boolean {
    if (this.heights[col]! >= this.rows) return false;
    const index = (this.rows - 1 - this.heights[col]!) * this.cols + col;
    this.board[index] = mark;
    const win = this.isWinAt(index, mark);
    this.board[index] = 0;
    return win;
  }

  private evaluate(mark: number): number {
    let score = 0;
    for (const line of this.lines) {
      let own = 0;
      let opp = 0;
      for (let i = 0; i < line.length; i++) {
        const v = this.board[line[i]!];
        if (v === mark) own++;
        else if (v !== 0) opp++;
      }
      if (own && !opp) score += this.weights[own]!;
      else if (opp && !own) score -= this.weights[opp]!;
    }
    const center = this.centerOrder[0]!;
    for (let r = 0; r < this.rows; r++) {
      const v = this.board[r * this.cols + center];
      if (v === mark) score += 3;
      else if (v !== 0) score -= 3;
    }
    return score;
  }

  private negamax(depth: number, alpha: number, beta: number, ply: number, mark: number): number {
    this.nodes++;
    if (
      (this.nodes & 2047) === 0 &&
      (this.options.now ?? performance.now.bind(performance))() > this.deadline
    )
      throw new Timeout();
    if (this.moves === this.cells) return 0;

    // Immediate win for the side to move.
    for (let c = 0; c < this.cols; c++) if (this.wouldWin(c, mark)) return WIN - ply;
    if (depth <= 0) return this.evaluate(mark);

    const key = this.key(mark);
    const entry = this.table.get(key);
    let ttBest = -1;
    if (entry) {
      ttBest = entry.best;
      if (entry.depth >= depth) {
        const v = entry.value;
        if (entry.flag === Flag.Exact) return v;
        if (entry.flag === Flag.Lower && v >= beta) return v;
        if (entry.flag === Flag.Upper && v <= alpha) return v;
      }
    }

    // If the opponent threatens to win in one place we must block there; two threats lose.
    const opp = 3 - mark;
    let forced = -1;
    let threats = 0;
    for (let c = 0; c < this.cols; c++) {
      if (this.wouldWin(c, opp)) {
        threats++;
        forced = c;
      }
    }
    if (threats > 1) return -(WIN - ply - 1);

    const alphaOrig = alpha;
    let best = -Infinity;
    let bestMove = -1;
    const order =
      forced >= 0
        ? [forced]
        : ttBest >= 0
          ? [ttBest, ...this.centerOrder.filter((c) => c !== ttBest)]
          : this.centerOrder;
    for (const col of order) {
      if (this.heights[col]! >= this.rows) continue;
      this.make(col, mark);
      const value = -this.negamax(depth - 1, -beta, -alpha, ply + 1, opp);
      this.unmake(col, mark);
      if (value > best) {
        best = value;
        bestMove = col;
      }
      if (value > alpha) alpha = value;
      if (alpha >= beta) break;
    }
    if (bestMove < 0) return 0;
    const flag = best <= alphaOrig ? Flag.Upper : best >= beta ? Flag.Lower : Flag.Exact;
    if (this.table.size > 2_000_000) this.table.clear();
    this.table.set(key, { depth, value: best, flag, best: bestMove });
    return best;
  }
}
