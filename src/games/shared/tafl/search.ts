/**
 * Fast tafl search: negamax alpha-beta on a mutable board with make/unmake, Zobrist hashing, a
 * transposition table, iterative deepening under a time budget, king moves and captures first.
 * The generic agent copies the whole history on every node, which kept it at depth 2–3 on 11×11;
 * this reaches about two plies deeper in the same time.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import {
  cornersOf,
  destinations,
  kingCaptured,
  throneOf,
  type TaflState,
  type TaflVariant,
} from './engine';
import { evaluateTafl } from './environment';

const WIN = 100_000;
class Timeout extends Error {}

interface Undo {
  from: number;
  to: number;
  piece: number;
  captured: number[];
  capturedPieces: number[];
}

export class TaflSearchAgent implements Agent<TaflState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;
  private board = new Int8Array(0);
  private hash = 0;
  private readonly zobrist: Int32Array;
  private readonly table = new Map<
    number,
    { depth: number; value: number; flag: 0 | 1 | 2; move: number }
  >();
  private readonly n: number;
  private readonly escapes: Set<number>;

  constructor(
    private readonly v: TaflVariant,
    private readonly o: {
      id: string;
      label: string;
      maxDepth: number;
      timeLimitMs?: number;
      now?: () => number;
    },
  ) {
    this.id = o.id;
    this.label = o.label;
    this.n = v.size;
    const area = v.size * v.size;
    // Deterministic pseudo-random keys (xorshift) so searches are reproducible.
    this.zobrist = new Int32Array(area * 4 + 1);
    let x = 0x9e3779b9 | 0;
    for (let i = 0; i < this.zobrist.length; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      this.zobrist[i] = x;
    }
    this.escapes = new Set(
      v.escape === 'corner'
        ? cornersOf(v)
        : Array.from({ length: area }, (_, p) => p).filter(
            (p) =>
              p < v.size || p >= area - v.size || p % v.size === 0 || p % v.size === v.size - 1,
          ),
    );
  }

  private owner = (piece: number) => (piece === 1 ? 0 : piece >= 2 ? 1 : -1);

  private moves(seat: 0 | 1): number[] {
    const out: number[] = [];
    const area = this.n * this.n;
    for (let p = 0; p < area; p++) {
      if (this.owner(this.board[p]!) !== seat) continue;
      for (const q of destinations(this.v, this.board as unknown as number[], p))
        out.push(p * area + q);
    }
    return out;
  }

  private hostileTo(p: number, seat: 0 | 1): boolean {
    const piece = this.board[p]!;
    if (piece !== 0) return this.owner(piece) === 1 - seat;
    if (this.v.escape === 'corner' && cornersOf(this.v).includes(p)) return true;
    return p === throneOf(this.v);
  }

  private neighbor(p: number, d: number): number {
    const n = this.n;
    const r = Math.floor(p / n);
    const c = p % n;
    if (d === 0) return r > 0 ? p - n : -1;
    if (d === 1) return r < n - 1 ? p + n : -1;
    if (d === 2) return c > 0 ? p - 1 : -1;
    return c < n - 1 ? p + 1 : -1;
  }

  private toggle(p: number, piece: number) {
    this.hash ^= this.zobrist[p * 4 + piece]!;
  }

  /** Plays a move; returns the undo record and the outcome it caused (1 the mover won). */
  private make(move: number, seat: 0 | 1): { undo: Undo; won: boolean } {
    const area = this.n * this.n;
    const from = Math.floor(move / area);
    const to = move % area;
    const piece = this.board[from]!;
    this.board[from] = 0;
    this.toggle(from, piece);
    this.board[to] = piece;
    this.toggle(to, piece);
    const undo: Undo = { from, to, piece, captured: [], capturedPieces: [] };
    let won = piece === 3 && this.escapes.has(to);
    for (let d = 0; d < 4; d++) {
      const q = this.neighbor(to, d);
      if (q < 0 || this.owner(this.board[q]!) !== 1 - seat) continue;
      if (this.board[q] === 3) {
        if (seat === 0 && kingCaptured(this.v, this.board as unknown as number[], q)) won = true;
        continue;
      }
      const beyond = this.neighbor(q, d);
      if (beyond >= 0 && this.hostileTo(beyond, (1 - seat) as 0 | 1)) {
        undo.captured.push(q);
        undo.capturedPieces.push(this.board[q]!);
        this.toggle(q, this.board[q]!);
        this.board[q] = 0;
      }
    }
    this.hash ^= this.zobrist[area * 4]!;
    return { undo, won };
  }

  private unmake(u: Undo) {
    const area = this.n * this.n;
    this.hash ^= this.zobrist[area * 4]!;
    for (let i = 0; i < u.captured.length; i++) {
      this.board[u.captured[i]!] = u.capturedPieces[i]!;
      this.toggle(u.captured[i]!, u.capturedPieces[i]!);
    }
    this.toggle(u.to, u.piece);
    this.board[u.to] = 0;
    this.board[u.from] = u.piece;
    this.toggle(u.from, u.piece);
  }

  private order(moves: number[], best: number): number[] {
    const area = this.n * this.n;
    const n = this.n;
    const key = (m: number) => {
      if (m === best) return 1000;
      const f = Math.floor(m / area);
      const t = m % area;
      if (this.board[f] === 3) return this.escapes.has(t) ? 900 : 50;
      let near = 0;
      for (const q of [t - n, t + n, t - 1, t + 1])
        if (
          q >= 0 &&
          q < area &&
          this.board[q] &&
          this.owner(this.board[q]!) !== this.owner(this.board[f]!)
        )
          near++;
      return near;
    };
    return moves.sort((a, b) => key(b) - key(a));
  }

  private evaluate(seat: 0 | 1): number {
    const s = { board: this.board as unknown as number[], toMove: seat } as TaflState;
    return Math.round(evaluateTafl(this.v, s, seat) * 1000);
  }

  private negamax(seat: 0 | 1, depth: number, alpha: number, beta: number, ply: number): number {
    this.nodes++;
    if ((this.nodes & 1023) === 0 && (this.o.now ?? (() => performance.now()))() > this.deadline)
      throw new Timeout();
    const key = this.hash ^ (seat ? 0x5bd1e995 : 0);
    const hit = this.table.get(key);
    let bestMove = -1;
    if (hit) {
      bestMove = hit.move;
      if (hit.depth >= depth) {
        if (hit.flag === 0) return hit.value;
        if (hit.flag === 1 && hit.value >= beta) return hit.value;
        if (hit.flag === 2 && hit.value <= alpha) return hit.value;
      }
    }
    if (depth <= 0) return this.evaluate(seat);
    const moves = this.moves(seat);
    if (moves.length === 0) return -(WIN - ply);
    const alpha0 = alpha;
    let best = -Infinity;
    for (const m of this.order(moves, bestMove)) {
      const { undo, won } = this.make(m, seat);
      const v = won
        ? WIN - ply
        : -this.negamax((1 - seat) as 0 | 1, depth - 1, -beta, -alpha, ply + 1);
      this.unmake(undo);
      if (v > best) {
        best = v;
        bestMove = m;
      }
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    this.table.set(key, {
      depth,
      value: best,
      flag: best <= alpha0 ? 2 : best >= beta ? 1 : 0,
      move: bestMove,
    });
    return best;
  }

  selectAction(
    env: GameEnvironment<TaflState, string>,
    state: TaflState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 1) return legal[0]!;
    const now = this.o.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.o.timeLimitMs].filter((x) => x !== undefined);
    this.deadline = limits.length ? now() + Math.min(...limits) : Infinity;
    this.nodes = 0;
    this.table.clear();
    this.board = Int8Array.from(state.board);
    this.hash = 0;
    this.board.forEach((piece, p) => {
      if (piece) this.toggle(p, piece);
    });
    const seat = state.toMove;
    const area = this.n * this.n;
    let order = ctx.rng.shuffle(this.moves(seat));
    let best = order[0]!;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.o.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        const scores = new Map<number, number>();
        for (const m of order) {
          const { undo, won } = this.make(m, seat);
          const v = won ? WIN : -this.negamax((1 - seat) as 0 | 1, depth - 1, -Infinity, -alpha, 1);
          this.unmake(undo);
          scores.set(m, v);
          if (v > alpha) alpha = v;
        }
        order = [...order].sort((a, b) => scores.get(b)! - scores.get(a)!);
        best = order[0]!;
        bestValue = alpha;
        reached = depth;
        if (Math.abs(alpha) >= WIN - 100) break;
      } catch (error) {
        if (error instanceof Timeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }
    this.lastStats = { nodes: this.nodes, depth: reached, value: bestValue };
    return `${Math.floor(best / area)}-${best % area}`;
  }
}
