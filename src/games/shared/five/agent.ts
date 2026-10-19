/**
 * Opponent for five-in-a-row games on large boards (Gomoku #007, Renju #008).
 * Candidate moves are empty points near existing stones; each candidate is scored by the 5-point
 * windows it completes for itself (attack) and denies to the opponent (defense). Alpha-beta search
 * runs over the best candidates with a whole-board window evaluation. Optional `isForbidden` lets
 * Renju exclude Black's forbidden points. Opponent code only — rules live in the game engine.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { LINE_DIRECTIONS } from '../../../core/game-engine/grid';
import type { MnkState } from '../mnk/engine';

const WIN = 10_000_000;
/** Weight of a 5-point window holding n stones of one side and none of the other. */
const WINDOW = [0, 1, 12, 160, 3_000, WIN];

export interface FiveAgentOptions {
  id: string;
  label: string;
  size: number;
  /** Search depth in plies (1 = greedy). */
  depth: number;
  /** Candidates searched per node. */
  breadth: number;
  /** Choose uniformly among the top `spread` root moves (≥ 1) — difficulty tuning. */
  spread?: number;
  /** Probability of a random nearby move — difficulty tuning. */
  randomness?: number;
  timeLimitMs?: number;
  /** Renju: points the side to move may not play. */
  isForbidden?: (state: MnkState, index: number) => boolean;
  now?: () => number;
}

class Timeout extends Error {}

export class FiveInRowAgent implements Agent<MnkState, number> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private readonly n: number;
  /** windows[i] = list of 5-point windows (as index arrays) containing point i. */
  private readonly windowsAt: Int16Array[][];
  private readonly allWindows: Int16Array[];
  private nodes = 0;
  private deadline = Infinity;

  constructor(private readonly options: FiveAgentOptions) {
    this.id = options.id;
    this.label = options.label;
    this.n = options.size;
    const n = this.n;
    this.allWindows = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        for (const [dr, dc] of LINE_DIRECTIONS) {
          const er = r + dr * 4;
          const ec = c + dc * 4;
          if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
          this.allWindows.push(
            Int16Array.from({ length: 5 }, (_, k) => (r + dr * k) * n + (c + dc * k)),
          );
        }
      }
    }
    this.windowsAt = Array.from({ length: n * n }, () => [] as Int16Array[]);
    for (const w of this.allWindows) for (const i of w) this.windowsAt[i]!.push(w);
  }

  selectAction(
    env: GameEnvironment<MnkState, number>,
    state: MnkState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const o = this.options;
    const now = o.now ?? (() => performance.now());
    this.deadline =
      (ctx.timeLimitMs ?? o.timeLimitMs) === undefined
        ? Infinity
        : now() + (ctx.timeLimitMs ?? o.timeLimitMs)!;
    this.nodes = 0;
    const board = Int8Array.from(state.board);
    const me = player === 0 ? 1 : 2;
    const legal = new Set(env.getLegalActions(state, player));
    if (legal.size === 0) throw new Error('FiveInRowAgent: no legal moves');
    const center = Math.floor(this.n / 2) * this.n + Math.floor(this.n / 2);
    if (state.history.length === 0 && legal.has(center)) return this.done(center, 0);

    const allowed = (i: number) => legal.has(i);
    const ranked = this.candidates(board, me, allowed);
    if (ranked.length === 0) return this.done(ctx.rng.pick([...legal]), 0);

    // Tactics first: win now, then block the opponent's five.
    for (const i of ranked) if (this.makesFive(board, i, me)) return this.done(i, WIN);
    const blocks = ranked.filter((i) => this.makesFive(board, i, 3 - me));
    if (blocks.length > 0) return this.done(blocks[0]!, 0);

    if (o.randomness && ctx.rng.chance(o.randomness))
      return this.done(ctx.rng.pick(ranked.slice(0, Math.min(12, ranked.length))), 0);

    const root = ranked.slice(0, o.breadth);
    // Iteration 1 is the static attack/defense ordering; deeper searches replace it only when they
    // complete within the time budget (iterative deepening over even depths ≥ 4).
    let best = root.map((i) => ({ i, v: this.moveScore(board, i, me) })).sort((a, b) => b.v - a.v);
    let reached = 1;
    const depths =
      o.depth <= 1
        ? []
        : o.depth < 4
          ? [o.depth]
          : Array.from({ length: Math.floor((o.depth - 2) / 2) }, (_, k) => 4 + 2 * k);
    for (const depth of depths) {
      try {
        const scored: { i: number; v: number }[] = [];
        let alpha = -Infinity;
        for (const { i } of best) {
          board[i] = me;
          const v = -this.negamax(board, depth - 1, -Infinity, -alpha, 3 - me, 1);
          board[i] = 0;
          scored.push({ i, v });
          if (v > alpha) alpha = v;
        }
        best = scored.sort((a, b) => b.v - a.v);
        reached = depth;
        if (best[0]!.v >= WIN - 100) break;
      } catch (error) {
        if (!(error instanceof Timeout)) throw error;
        for (let k = 0; k < board.length; k++) board[k] = state.board[k]!;
        break;
      }
    }
    const top = best.filter((m) => m.v >= best[0]!.v - 1e-9);
    const pool = o.spread && o.spread > 1 ? best.slice(0, o.spread) : top;
    this.lastStats = { nodes: this.nodes, depth: reached, value: best[0]!.v };
    return ctx.rng.pick(pool).i;
  }

  private done(i: number, value: number): number {
    this.lastStats = { nodes: this.nodes, depth: this.options.depth, value };
    return i;
  }

  /** Empty points within distance 2 of a stone, best static score first. */
  private candidates(board: Int8Array, me: number, allowed: (i: number) => boolean): number[] {
    const n = this.n;
    const near = new Set<number>();
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) continue;
      const r = Math.floor(i / n);
      const c = i % n;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
          const j = rr * n + cc;
          if (!board[j] && allowed(j)) near.add(j);
        }
      }
    }
    return [...near].sort((a, b) => this.moveScore(board, b, me) - this.moveScore(board, a, me));
  }

  private makesFive(board: Int8Array, i: number, mark: number): boolean {
    for (const w of this.windowsAt[i]!) {
      let all = true;
      for (let k = 0; k < 5; k++) {
        const j = w[k]!;
        if (j !== i && board[j] !== mark) {
          all = false;
          break;
        }
      }
      if (all) return true;
    }
    return false;
  }

  /** Attack + defense value of playing point i for `mark`. */
  private moveScore(board: Int8Array, i: number, mark: number): number {
    const opp = 3 - mark;
    let attack = 0;
    let defense = 0;
    for (const w of this.windowsAt[i]!) {
      let mine = 0;
      let theirs = 0;
      for (let k = 0; k < 5; k++) {
        const v = board[w[k]!];
        if (v === mark) mine++;
        else if (v === opp) theirs++;
      }
      if (theirs === 0) attack += WINDOW[mine + 1]! - WINDOW[mine]!;
      if (mine === 0) defense += WINDOW[theirs + 1]! - WINDOW[theirs]!;
    }
    return attack * 1.1 + defense;
  }

  private evaluate(board: Int8Array, mark: number): number {
    let score = 0;
    for (const w of this.allWindows) {
      let mine = 0;
      let theirs = 0;
      for (let k = 0; k < 5; k++) {
        const v = board[w[k]!];
        if (v === mark) mine++;
        else if (v !== 0) theirs++;
      }
      // The side to move executes its threats first, so its windows count for more (tempo).
      if (mine && !theirs) score += WINDOW[mine]! * 1.5;
      else if (theirs && !mine) score -= WINDOW[theirs]!;
    }
    return score;
  }

  private negamax(
    board: Int8Array,
    depth: number,
    alpha: number,
    beta: number,
    mark: number,
    ply: number,
  ): number {
    this.nodes++;
    if (
      (this.nodes & 255) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
    const ranked = this.candidates(board, mark, () => true).slice(0, this.options.breadth);
    if (ranked.length === 0) return 0;
    for (const i of ranked) if (this.makesFive(board, i, mark)) return WIN - ply;
    if (depth <= 0) return this.evaluate(board, mark);
    let best = -Infinity;
    for (const i of ranked) {
      board[i] = mark;
      const v = -this.negamax(board, depth - 1, -beta, -alpha, 3 - mark, ply + 1);
      board[i] = 0;
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
}
