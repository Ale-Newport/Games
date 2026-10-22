/**
 * Alpha-beta for the domino games on a mutable occupancy array: iterative deepening with a
 * transposition table (occupancy + side to move), moves ordered by how many of the opponent's
 * placements they destroy, and a mobility evaluation (own placements minus the opponent's) for
 * partizan Domineering, plus twice the difference in "safe" placements the opponent can never
 * block. Cram is impartial — both sides always have the same placements — so its leaves use a parity
 * estimate instead: how many more dominoes fit (packed greedily), odd being good for the mover.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import type { DominoState, DominoVariant, Orientation } from './engine';

const WIN = 10_000;
class Timeout extends Error {}

interface Move {
  a: string;
  p: number;
  q: number;
}

export interface DominoSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  randomness?: number;
  now?: () => number;
}

export class DominoSearchAgent implements Agent<DominoState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;
  private table = new Map<string, { depth: number; value: number }>();
  private board = new Uint8Array(0);
  /** Every placement on the board per orientation, precomputed. */
  private all: Record<Orientation, Move[]> = { v: [], h: [] };

  constructor(
    private readonly v: DominoVariant,
    private readonly options: DominoSearchOptions,
  ) {
    this.id = options.id;
    this.label = options.label;
    for (let r = 0; r < v.rows; r++)
      for (let c = 0; c < v.cols; c++) {
        const p = r * v.cols + c;
        if (r + 1 < v.rows) this.all.v.push({ a: `${r},${c},v`, p, q: p + v.cols });
        if (c + 1 < v.cols) this.all.h.push({ a: `${r},${c},h`, p, q: p + 1 });
      }
  }

  private moves(seat: 0 | 1): Move[] {
    const out: Move[] = [];
    for (const o of this.v.allowed[seat])
      for (const m of this.all[o]) if (!this.board[m.p] && !this.board[m.q]) out.push(m);
    return out;
  }

  /** Placements of `seat` that no placement of the other seat can ever block. */
  private safe(seat: 0 | 1): number {
    const theirs = this.moves((1 - seat) as 0 | 1);
    const blocked = new Uint8Array(this.board.length);
    for (const m of theirs) blocked[m.p] = blocked[m.q] = 1;
    // Count disjoint safe placements greedily so two of them never share a cell.
    const used = new Uint8Array(this.board.length);
    let n = 0;
    for (const m of this.moves(seat))
      if (!blocked[m.p] && !blocked[m.q] && !used[m.p] && !used[m.q]) {
        used[m.p] = used[m.q] = 1;
        n++;
      }
    return n;
  }

  private evaluate(seat: 0 | 1): number {
    const other = (1 - seat) as 0 | 1;
    if (this.v.allowed[0].length === 1) {
      // Partizan (Domineering): mobility plus safe moves, which the opponent can never take away.
      return (
        this.moves(seat).length -
        this.moves(other).length +
        2 * (this.safe(seat) - this.safe(other))
      );
    }
    // Impartial (Cram): the game lasts about as many moves as dominoes still fit; an odd count
    // favors the side to move. Packed greedily, row by row, as an estimate.
    const used = this.board.slice();
    let fit = 0;
    for (const m of [...this.all.h, ...this.all.v])
      if (!used[m.p] && !used[m.q]) {
        used[m.p] = used[m.q] = 1;
        fit++;
      }
    return fit % 2 === 1 ? 5 : -5;
  }

  private key(seat: 0 | 1): string {
    let k = '';
    for (let i = 0; i < this.board.length; i += 16) {
      let chunk = 0;
      for (let j = 0; j < 16 && i + j < this.board.length; j++)
        if (this.board[i + j]) chunk |= 1 << j;
      k += `${chunk.toString(36)}.`;
    }
    return k + seat;
  }

  private order(seat: 0 | 1, moves: Move[]): Move[] {
    const theirs = this.moves((1 - seat) as 0 | 1);
    const hits = new Uint16Array(this.board.length);
    for (const m of theirs) {
      hits[m.p]!++;
      hits[m.q]!++;
    }
    return moves
      .map((m) => ({ m, k: hits[m.p]! + hits[m.q]! }))
      .sort((x, y) => y.k - x.k)
      .map((x) => x.m);
  }

  selectAction(
    env: GameEnvironment<DominoState, string>,
    state: DominoState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 1) return legal[0]!;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return ctx.rng.pick(legal);
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    this.deadline = limits.length ? now() + Math.min(...limits) : Infinity;
    this.nodes = 0;
    this.table.clear();
    this.board = Uint8Array.from(state.cells, (c) => (c === -1 ? 0 : 1));
    const seat = state.toMove;
    let order = this.order(seat, ctx.rng.shuffle(this.moves(seat)));
    let best = order[0]!.a;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        const scores = new Map<Move, number>();
        for (const m of order) {
          this.board[m.p] = this.board[m.q] = 1;
          const v = -this.negamax((1 - seat) as 0 | 1, depth - 1, -Infinity, -alpha, 1);
          this.board[m.p] = this.board[m.q] = 0;
          scores.set(m, v);
          if (v > alpha) alpha = v;
        }
        order = [...order].sort((x, y) => scores.get(y)! - scores.get(x)!);
        best = order[0]!.a;
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
    return best;
  }

  private negamax(seat: 0 | 1, depth: number, alpha: number, beta: number, ply: number): number {
    this.nodes++;
    if (
      (this.nodes & 1023) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
    const moves = this.moves(seat);
    if (moves.length === 0) return -(WIN - ply);
    if (depth <= 0) return this.evaluate(seat);
    const key = this.key(seat);
    const hit = this.table.get(key);
    if (hit && hit.depth >= depth) return hit.value;
    const alpha0 = alpha;
    let best = -Infinity;
    for (const m of this.order(seat, moves)) {
      this.board[m.p] = this.board[m.q] = 1;
      const v = -this.negamax((1 - seat) as 0 | 1, depth - 1, -beta, -alpha, ply + 1);
      this.board[m.p] = this.board[m.q] = 0;
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    if (best > alpha0 && best < beta) this.table.set(key, { depth, value: best });
    return best;
  }
}
