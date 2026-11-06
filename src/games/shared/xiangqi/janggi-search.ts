/**
 * Janggi opponent: negamax alpha-beta on `JanggiPosition` with quiescence on captures,
 * transposition table, MVV-LVA + killer ordering, iterative deepening, passing as a move, draw
 * contempt, and a material evaluation using the official piece points.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import {
  type JanggiPosition,
  PASS,
  janggiMoveAction,
  janggiPositionOf,
  type JMove,
  type JanggiState,
} from './janggi';
import { COLS, HORSE, CHARIOT, CANNON, SOLDIER, type Side } from './position';

const VALUE = [0, 0, 300, 300, 500, 1300, 700, 200];
const MATE = 1_000_000;
const MATE_BOUND = MATE - 10_000;
const CONTEMPT = 40;

const enum Bound {
  Exact,
  Lower,
  Upper,
}

class Timeout extends Error {}

export interface JanggiSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  randomness?: number;
  now?: () => number;
}

type Choice = JMove | null; // null = pass

function positional(type: number, sq: number, side: Side): number {
  const row = Math.floor(sq / COLS);
  const col = sq % COLS;
  const advance = side === 0 ? 9 - row : row;
  const center = 4 - Math.abs(col - 4);
  switch (type) {
    case SOLDIER:
      return advance * 8 + (advance >= 6 ? center * 6 : 0);
    case HORSE:
      return center * 8 + Math.min(advance, 6) * 5;
    case CHARIOT:
      return Math.min(advance, 6) * 4;
    case CANNON:
      return center * 3;
    default:
      return 0;
  }
}

export class JanggiSearchAgent implements Agent<JanggiState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;
  private table = new Map<number, { depth: number; value: number; bound: Bound; best: number }>();
  private killers: number[][] = [];
  private path: number[] = [];

  constructor(private readonly options: JanggiSearchOptions) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<JanggiState, string>,
    state: JanggiState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('JanggiSearchAgent: no legal moves');
    if (legal.length === 1) return legal[0]!;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness)) {
      const moves = legal.filter((a) => a !== PASS);
      return ctx.rng.pick(moves.length ? moves : legal);
    }
    const pos = janggiPositionOf(state);
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    const budget = limits.length ? Math.min(...limits) : undefined;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    this.table.clear();
    this.killers = [];
    this.path = [...state.keys];
    const me = pos.side;
    const lastPass = state.history[state.history.length - 1] === PASS;
    // Passing right after a pass ends the game on points: take it when ahead, never otherwise.
    if (lastPass && legal.includes(PASS) && pos.points(me) > pos.points((1 - me) as Side))
      return PASS;
    let rootMoves: Choice[] = ctx.rng.shuffle(pos.legalMoves());
    if (legal.includes(PASS) && !lastPass) rootMoves.push(null);
    let best: Choice = rootMoves[0]!;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        let iterationBest: Choice = rootMoves[0]!;
        const scores = new Map<Choice, number>();
        for (const m of this.ordered(rootMoves, 0, -1)) {
          const u = this.play(pos, m);
          this.path.push(pos.key());
          const v = -this.negamax(pos, depth - 1, -Infinity, -alpha, 1, m === null);
          this.path.pop();
          this.undo(pos, m, u);
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
    return best === null ? PASS : janggiMoveAction(best);
  }

  private play(pos: JanggiPosition, m: Choice) {
    if (m) return pos.make(m);
    const undo = { hashHi: pos.hashHi, hashLo: pos.hashLo };
    pos.passTurn();
    return undo;
  }

  private undo(pos: JanggiPosition, m: Choice, u: { hashHi: number; hashLo: number }) {
    if (m) pos.unmake(m, u);
    else {
      pos.passTurn();
      pos.hashHi = u.hashHi;
      pos.hashLo = u.hashLo;
    }
  }

  private evaluate(pos: JanggiPosition): number {
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
    return score + (me === 1 ? 150 : -150); // Han's 1.5-point bonus
  }

  private moveKey(m: Choice) {
    return m ? m.from * 90 + m.to : 8191;
  }

  private ordered(moves: Choice[], ply: number, ttBest: number): Choice[] {
    const killers = this.killers[ply] ?? [];
    const score = (m: Choice) => {
      const k = this.moveKey(m);
      if (k === ttBest) return 1e9;
      if (!m) return -1;
      if (m.captured) return 1e6 + VALUE[Math.abs(m.captured)]! * 10 - VALUE[Math.abs(m.piece)]!;
      if (killers.includes(k)) return 5e5;
      return 0;
    };
    return moves.slice().sort((a, b) => score(b) - score(a));
  }

  private tick() {
    this.nodes++;
    if (
      (this.nodes & 511) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
  }

  private negamax(
    pos: JanggiPosition,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
    afterPass: boolean,
  ): number {
    this.tick();
    const key = pos.key();
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
    const inCheck = pos.inCheck(me);
    let best = -Infinity;
    let bestMove = -1;
    let legalCount = 0;
    if (afterPass && !inCheck) {
      // Passing back would end the game on points.
      const ahead = pos.points(me) > pos.points((1 - me) as Side);
      best = ahead ? MATE_BOUND - 1 - ply : -(MATE_BOUND - 1 - ply);
      if (best > alpha) alpha = best;
      if (alpha >= beta) return best;
    }
    const alphaOrig = alpha;
    const moves: Choice[] = pos.pseudoMoves();
    // Passing is allowed out of check; two passes in a row end the game, so do not chain them.
    if (!inCheck && !afterPass) moves.push(null);
    for (const m of this.ordered(moves, ply, entry?.best ?? -1)) {
      const u = this.play(pos, m);
      if (m && pos.inCheck(me)) {
        this.undo(pos, m, u);
        continue;
      }
      legalCount++;
      this.path.push(pos.key());
      const v = -this.negamax(pos, depth - 1, -beta, -alpha, ply + 1, m === null);
      this.path.pop();
      this.undo(pos, m, u);
      if (v > best) {
        best = v;
        bestMove = this.moveKey(m);
      }
      if (v > alpha) alpha = v;
      if (alpha >= beta) {
        if (m && !m.captured) {
          const k = (this.killers[ply] ??= []);
          if (!k.includes(bestMove)) {
            k.unshift(bestMove);
            k.length = Math.min(k.length, 2);
          }
        }
        break;
      }
    }
    if (legalCount === 0) return inCheck ? -(MATE - ply) : this.evaluate(pos);
    const bound = best <= alphaOrig ? Bound.Upper : best >= beta ? Bound.Lower : Bound.Exact;
    if (this.table.size > 200_000) this.table.clear();
    this.table.set(key, { depth, value: best, bound, best: bestMove });
    return best;
  }

  private quiesce(pos: JanggiPosition, alpha: number, beta: number, ply: number, qdepth: number) {
    this.tick();
    const stand = this.evaluate(pos);
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    if (qdepth > 5) return stand;
    const me = pos.side;
    let best = stand;
    const captures = pos.pseudoMoves().filter((m) => m.captured !== 0);
    for (const m of this.ordered(captures, ply, -1) as JMove[]) {
      const u = pos.make(m);
      if (pos.inCheck(me)) {
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
