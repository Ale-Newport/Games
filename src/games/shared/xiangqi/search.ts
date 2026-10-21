/**
 * Xiangqi opponent on the shared `XiangqiPosition`: negamax alpha-beta with quiescence on
 * captures, transposition table, MVV-LVA + killer ordering, iterative deepening under a time
 * budget, and repetition awareness from the real game history.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { positionOf, type XiangqiState } from './game';
import {
  ADVISOR,
  CANNON,
  CHARIOT,
  COLS,
  ELEPHANT,
  HORSE,
  SOLDIER,
  moveAction,
  type Side,
  type XMove,
  type XiangqiPosition,
} from './position';

const VALUE = [0, 0, 200, 200, 400, 900, 450, 100];
const MATE = 1_000_000;
const MATE_BOUND = MATE - 10_000;
const CONTEMPT = 40;

const enum Bound {
  Exact,
  Lower,
  Upper,
}

class Timeout extends Error {}

export interface XiangqiSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  randomness?: number;
  now?: () => number;
}

/** Positional bonus for a piece of `side` on `sq` (rows counted from that side's back rank). */
function positional(type: number, sq: number, side: Side): number {
  const row = Math.floor(sq / COLS);
  const col = sq % COLS;
  const advance = side === 0 ? 9 - row : row; // 0 on the own back rank
  const center = 4 - Math.abs(col - 4);
  switch (type) {
    case SOLDIER:
      // Crossed soldiers double in value; the closer to the palace the better, edge files less.
      return advance >= 5 ? 100 + (advance - 5) * 15 + center * 6 : advance * 5;
    case HORSE:
      return center * 8 + Math.min(advance, 6) * 6;
    case CANNON:
      return center * 4 + (advance === 2 ? 10 : 0);
    case CHARIOT:
      return center * 3 + Math.min(advance, 6) * 4;
    case ADVISOR:
    case ELEPHANT:
      return 0;
    default:
      return 0;
  }
}

export class XiangqiSearchAgent implements Agent<XiangqiState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;
  private table = new Map<number, { depth: number; value: number; bound: Bound; best: number }>();
  private killers: number[][] = [];
  private path: number[] = [];

  constructor(private readonly options: XiangqiSearchOptions) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<XiangqiState, string>,
    state: XiangqiState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('XiangqiSearchAgent: no legal moves');
    if (legal.length === 1) return legal[0]!;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return ctx.rng.pick(legal);
    const pos = positionOf(state);
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    const budget = limits.length ? Math.min(...limits) : undefined;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    this.table.clear();
    this.killers = [];
    this.path = [...state.keys];
    let rootMoves = ctx.rng.shuffle(pos.legalMoves());
    let best = rootMoves[0]!;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        let iterationBest = rootMoves[0]!;
        const scores = new Map<XMove, number>();
        for (const m of this.ordered(rootMoves, 0, -1)) {
          const u = pos.make(m);
          this.path.push(pos.key());
          const v = -this.negamax(pos, depth - 1, -Infinity, -alpha, 1);
          this.path.pop();
          pos.unmake(m, u);
          scores.set(m, v);
          if (v > alpha) {
            alpha = v;
            iterationBest = m;
          }
        }
        best = iterationBest;
        bestValue = alpha;
        reached = depth;
        rootMoves = [...rootMoves].sort(
          (a, b) => (scores.get(b) ?? -Infinity) - (scores.get(a) ?? -Infinity),
        );
        if (Math.abs(alpha) >= MATE_BOUND) break;
      } catch (error) {
        if (error instanceof Timeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }
    this.lastStats = { nodes: this.nodes, depth: reached, value: bestValue };
    return moveAction(best);
  }

  private evaluate(pos: XiangqiPosition): number {
    let score = 0;
    const me = pos.side;
    for (let sq = 0; sq < pos.board.length; sq++) {
      const code = pos.board[sq]!;
      if (code === 0) continue;
      const side: Side = code > 0 ? 0 : 1;
      const type = Math.abs(code);
      const v = VALUE[type]! + positional(type, sq, side);
      score += side === me ? v : -v;
    }
    return score;
  }

  private moveKey(m: XMove) {
    return m.from * 90 + m.to;
  }

  private ordered(moves: XMove[], ply: number, ttBest: number): XMove[] {
    const killers = this.killers[ply] ?? [];
    const score = (m: XMove) => {
      const k = this.moveKey(m);
      if (k === ttBest) return 1e9;
      if (m.captured) return 1e6 + VALUE[Math.abs(m.captured)]! * 10 - VALUE[Math.abs(m.piece)]!;
      if (killers.includes(k)) return 5e5;
      return 0;
    };
    return moves.slice().sort((a, b) => score(b) - score(a));
  }

  private tick() {
    this.nodes++;
    if (
      (this.nodes & 1023) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
  }

  private legalAfter(pos: XiangqiPosition, me: Side) {
    return !pos.inCheck(me) && !pos.generalsFace();
  }

  private negamax(
    pos: XiangqiPosition,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
  ): number {
    this.tick();
    const key = pos.key();
    // Repetitions count as a slightly bad draw for the root player (contempt).
    for (let i = this.path.length - 3; i >= 0; i -= 2)
      if (this.path[i] === key) return ply % 2 === 0 ? -CONTEMPT : CONTEMPT;
    if (depth <= 0) return this.quiesce(pos, alpha, beta, ply, 0);
    const entry = this.table.get(key);
    if (entry && entry.depth >= depth) {
      if (entry.bound === Bound.Exact) return entry.value;
      if (entry.bound === Bound.Lower && entry.value >= beta) return entry.value;
      if (entry.bound === Bound.Upper && entry.value <= alpha) return entry.value;
    }
    const me = pos.side;
    const alphaOrig = alpha;
    let best = -Infinity;
    let bestMove = -1;
    let legalCount = 0;
    for (const m of this.ordered(pos.pseudoMoves(), ply, entry?.best ?? -1)) {
      const u = pos.make(m);
      if (!this.legalAfter(pos, me)) {
        pos.unmake(m, u);
        continue;
      }
      legalCount++;
      this.path.push(pos.key());
      const v = -this.negamax(pos, depth - 1, -beta, -alpha, ply + 1);
      this.path.pop();
      pos.unmake(m, u);
      if (v > best) {
        best = v;
        bestMove = this.moveKey(m);
      }
      if (v > alpha) alpha = v;
      if (alpha >= beta) {
        if (!m.captured) {
          const k = (this.killers[ply] ??= []);
          if (!k.includes(bestMove)) {
            k.unshift(bestMove);
            k.length = Math.min(k.length, 2);
          }
        }
        break;
      }
    }
    if (legalCount === 0) return -(MATE - ply); // mate or stalemate: both lose in xiangqi
    const bound = best <= alphaOrig ? Bound.Upper : best >= beta ? Bound.Lower : Bound.Exact;
    if (this.table.size > 300_000) this.table.clear();
    this.table.set(key, { depth, value: best, bound, best: bestMove });
    return best;
  }

  private quiesce(pos: XiangqiPosition, alpha: number, beta: number, ply: number, qdepth: number) {
    this.tick();
    const stand = this.evaluate(pos);
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    if (qdepth > 6) return stand;
    const me = pos.side;
    let best = stand;
    const captures = pos.pseudoMoves().filter((m) => m.captured !== 0);
    for (const m of this.ordered(captures, ply, -1)) {
      const u = pos.make(m);
      if (!this.legalAfter(pos, me)) {
        pos.unmake(m, u);
        continue;
      }
      const v = -this.quiesce(pos, -beta, -alpha, ply + 1, qdepth + 1);
      pos.unmake(m, u);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
}
