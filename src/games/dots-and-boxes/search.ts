/**
 * Dots and Boxes opponents. `GreedyDotsAgent` takes boxes, then plays safe lines (ones that hand
 * nothing over), and when none is left gives away the smallest chain. `DotsSearchAgent` runs a
 * negamax on mutable arrays over "net boxes from here" with a transposition table keyed by the
 * drawn-line mask, captures not counting toward depth, and a reduced move set: when a box can be
 * taken it considers taking one (all captures commute) and the double-dealing reply that leaves
 * the last two boxes of a chain to the opponent; otherwise safe lines, or every line once none is
 * safe.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { BOXES, BOX_LINES, LINES, LINE_BOXES, type DotsState } from './engine';

class Timeout extends Error {}

/** Mutable board used inside the searches. */
class Board {
  lines: Uint8Array;
  sides: Uint8Array;
  constructor(s: Pick<DotsState, 'lines'>) {
    this.lines = Uint8Array.from(s.lines, (v) => (v ? 1 : 0));
    this.sides = new Uint8Array(BOXES);
    for (let b = 0; b < BOXES; b++)
      this.sides[b] = BOX_LINES[b]!.reduce((n, l) => n + this.lines[l]!, 0);
  }
  /** Draws `l`; returns the number of boxes completed. */
  draw(l: number): number {
    this.lines[l] = 1;
    let done = 0;
    for (const b of LINE_BOXES[l]!) if (++this.sides[b]! === 4) done++;
    return done;
  }
  erase(l: number) {
    this.lines[l] = 0;
    for (const b of LINE_BOXES[l]!) this.sides[b]!--;
  }
  free(): number[] {
    const out: number[] = [];
    for (let l = 0; l < LINES; l++) if (!this.lines[l]) out.push(l);
    return out;
  }
  missing(b: number): number[] {
    return BOX_LINES[b]!.filter((l) => !this.lines[l]);
  }
  /** A line that completes a box right now, if any. */
  capture(): number | null {
    for (let b = 0; b < BOXES; b++) if (this.sides[b] === 3) return this.missing(b)[0]!;
    return null;
  }
  /** Drawing `l` gives the opponent no box. */
  safe(l: number): boolean {
    return LINE_BOXES[l]!.every((b) => this.sides[b]! < 2);
  }
  /** Boxes the opponent collects greedily after `l` is drawn (the board is restored). */
  giveaway(l: number): number {
    const drawn = [l];
    this.draw(l);
    let taken = 0;
    for (;;) {
      const c = this.capture();
      if (c === null) break;
      taken += this.draw(c);
      drawn.push(c);
    }
    for (const d of drawn.reverse()) this.erase(d);
    return taken;
  }
  key(): number {
    let k = 0;
    for (let l = 0; l < LINES; l++) if (this.lines[l]) k += 2 ** l;
    return k;
  }
}

export class GreedyDotsAgent implements Agent<DotsState, number> {
  constructor(
    readonly id: string,
    readonly label: string,
    /** Give away the smallest chain when no safe line is left (otherwise any line). */
    private readonly smallestSacrifice: boolean,
    private readonly randomness = 0,
  ) {}

  selectAction(
    env: GameEnvironment<DotsState, number>,
    state: DotsState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const legal = env.getLegalActions(state, player);
    if (this.randomness && ctx.rng.chance(this.randomness)) return ctx.rng.pick(legal);
    const board = new Board(state);
    const capture = board.capture();
    if (capture !== null) return capture;
    const safe = legal.filter((l) => board.safe(l));
    if (safe.length) return ctx.rng.pick(safe);
    if (!this.smallestSacrifice) return ctx.rng.pick(legal);
    const cost = new Map(legal.map((l) => [l, board.giveaway(l)]));
    const least = Math.min(...cost.values());
    return ctx.rng.pick(legal.filter((l) => cost.get(l) === least));
  }
}

interface Entry {
  depth: number;
  value: number;
}

export class DotsSearchAgent implements Agent<DotsState, number> {
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;
  private table = new Map<number, Entry>();
  private board!: Board;

  constructor(
    readonly id: string,
    readonly label: string,
    private readonly options: { maxDepth: number; timeLimitMs?: number; now?: () => number },
  ) {}

  selectAction(
    env: GameEnvironment<DotsState, number>,
    state: DotsState,
    player: PlayerId,
    ctx: DecisionContext,
  ): number {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 1) return legal[0]!;
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    this.deadline = limits.length ? now() + Math.min(...limits) : Infinity;
    this.nodes = 0;
    this.table.clear();
    this.board = new Board(state);
    let order = ctx.rng.shuffle(this.candidates());
    let best = order[0]!;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        const scores = new Map<number, number>();
        let iterationBest = order[0]!;
        for (const l of order) {
          const v = this.child(l, depth, alpha, Infinity);
          scores.set(l, v);
          if (v > alpha) {
            alpha = v;
            iterationBest = l;
          }
        }
        best = iterationBest;
        bestValue = alpha;
        reached = depth;
        order = [...order].sort((a, b) => scores.get(b)! - scores.get(a)!);
        // The whole remaining game was searched: nothing more to learn.
        if (depth > this.board.free().length + 1) break;
      } catch (error) {
        if (error instanceof Timeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }
    this.lastStats = { nodes: this.nodes, depth: reached, value: bestValue };
    return best;
  }

  /** Value for the mover of drawing `l` (net boxes from here on). */
  private child(l: number, depth: number, alpha: number, beta: number): number {
    const done = this.board.draw(l);
    let v: number;
    if (done)
      // Same player again; captures do not use up depth.
      v = done + this.negamax(depth, alpha - done, beta - done);
    else v = -this.negamax(depth - 1, -beta, -alpha);
    this.board.erase(l);
    return v;
  }

  /** Moves worth searching in the current position. */
  private candidates(): number[] {
    const b = this.board;
    const capture = b.capture();
    if (capture !== null) {
      const out = [capture];
      // Double-dealing: with a capturable box whose missing line is shared with a two-sided box,
      // draw that box's other missing line instead, handing both boxes over.
      for (let box = 0; box < BOXES; box++) {
        if (b.sides[box] !== 3) continue;
        const shared = b.missing(box)[0]!;
        for (const other of LINE_BOXES[shared]!) {
          if (other === box || b.sides[other] !== 2) continue;
          for (const l of b.missing(other)) if (l !== shared && !out.includes(l)) out.push(l);
        }
      }
      return out;
    }
    const free = b.free();
    const safe = free.filter((l) => b.safe(l));
    return safe.length ? safe : free;
  }

  private negamax(depth: number, alpha: number, beta: number): number {
    this.nodes++;
    if (
      (this.nodes & 1023) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
    if (depth <= 0 && this.board.capture() === null) return 0;
    const moves = this.candidates();
    if (moves.length === 0) return 0;
    const key = this.board.key();
    const hit = this.table.get(key);
    if (hit && hit.depth >= depth) return hit.value;
    const alpha0 = alpha;
    let best = -Infinity;
    for (const l of moves) {
      const v = this.child(l, depth, alpha, beta);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    // Only exact values are stored (fail-high and fail-low results are bounds).
    if (best > alpha0 && best < beta) this.table.set(key, { depth, value: best });
    return best;
  }
}
