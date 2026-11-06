/**
 * Chess opponent working directly on the shared `Position` (same move generator as the rules):
 * negamax alpha-beta with quiescence, transposition table, MVV-LVA + killer ordering, iterative
 * deepening under a time budget, and variant-aware evaluation/terminal rules.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { parseFen } from './fen';
import { moveAction, type ChessState, type ChessVariant } from './game';
import {
  EMPTY,
  FLAG_CASTLE,
  KING,
  PAWN,
  type Position,
  pieceColor,
  pieceType,
  type Color,
  type Move,
} from './position';

const VALUE = [0, 100, 320, 330, 500, 900, 0];
const MATE = 1_000_000;
const MATE_BOUND = MATE - 10_000;

// Piece-square tables from White's point of view, a8..h8 first (rank 8 at index 0).
const PST: Record<number, number[]> = {
  [PAWN]: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5,
    10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  2: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10,
    0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10,
    5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  3: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0,
    -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10,
    -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  4: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
    0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0,
    5, 5, 0, 0, 0,
  ],
  5: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0,
    0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  [KING]: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
  ],
};

const enum Bound {
  Exact,
  Lower,
  Upper,
}

class Timeout extends Error {}

/** Manhattan distance from the board center (0 in the middle). */
const centerDistance = (f: number, r: number, W: number, H: number) =>
  Math.abs(f - (W - 1) / 2) + Math.abs(r - (H - 1) / 2);

export interface ChessSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  randomness?: number;
  now?: () => number;
}

export class ChessSearchAgent implements Agent<ChessState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;
  private table = new Map<number, { depth: number; value: number; bound: Bound; best: number }>();
  private killers: number[][] = [];
  private checks: [number, number] = [0, 0];
  private path: number[] = [];

  constructor(
    private readonly variant: ChessVariant,
    private readonly options: ChessSearchOptions,
  ) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<ChessState, string>,
    state: ChessState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('ChessSearchAgent: no legal moves');
    if (legal.length === 1) return legal[0]!;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return ctx.rng.pick(legal);
    const pos = parseFen(this.variant.rules, state.fen);
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    const budget = limits.length ? Math.min(...limits) : undefined;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    this.table.clear();
    this.killers = [];
    this.checks = [state.checks[0], state.checks[1]];
    this.path = this.historyKeys(state);
    let rootMoves = ctx.rng.shuffle(pos.legalMoves());
    let best = rootMoves[0]!;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        let iterationBest = rootMoves[0]!;
        const scores = new Map<Move, number>();
        for (const m of this.ordered(pos, rootMoves, 0, -1)) {
          const undo = this.makeTracked(pos, m);
          const v = this.variantWin(pos) ?? -this.negamax(pos, depth - 1, -Infinity, -alpha, 1);
          this.unmakeTracked(pos, m, undo);
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
    return moveAction(pos, best);
  }

  /** Zobrist keys of the game's positions since the last capture or pawn move (root included). */
  private historyKeys(state: ChessState): number[] {
    const reversible = state.keys.length; // positions since the last irreversible move
    const pos = parseFen(this.variant.rules, state.startFen);
    const keys = [pos.key()];
    for (const action of state.history) {
      const m = pos.legalMoves().find((x) => moveAction(pos, x) === action);
      if (!m) break;
      pos.make(m);
      keys.push(pos.key());
    }
    return keys.slice(-reversible);
  }

  // ---- variant helpers ---------------------------------------------------------------------
  private makeTracked(pos: Position, m: Move) {
    const mover = pos.side;
    const undo = pos.make(m);
    let gaveCheck = false;
    if (this.variant.goal === 'three-check' && pos.inCheck()) {
      this.checks[mover]++;
      gaveCheck = true;
    }
    this.path.push(pos.key());
    return { undo, gaveCheck, mover };
  }

  private unmakeTracked(
    pos: Position,
    m: Move,
    u: { undo: ReturnType<Position['make']>; gaveCheck: boolean; mover: Color },
  ) {
    this.path.pop();
    if (u.gaveCheck) this.checks[u.mover]--;
    pos.unmake(m, u.undo);
  }

  /**
   * Value for the player who just moved when that move won by a variant rule (king on the hill,
   * third check); null otherwise. Mates closer to the root score higher.
   */
  private variantWin(pos: Position): number | null {
    const mover = (1 - pos.side) as Color;
    if (this.variant.goal === 'king-of-the-hill') {
      const k = pos.kings[mover];
      const f = pos.fileOf(k);
      const r = pos.rankOf(k);
      if ((f === 3 || f === 4) && (r === 3 || r === 4)) return MATE - this.path.length;
    }
    if (this.variant.goal === 'three-check' && this.checks[mover] >= 3)
      return MATE - this.path.length;
    return null;
  }

  private evaluate(pos: Position): number {
    const W = pos.W;
    const H = pos.H;
    const anti = this.variant.goal === 'antichess';
    // Non-pawn material per color (endgame / mop-up detection) and pawn counts.
    const heavy: [number, number] = [0, 0];
    const pawns: [number, number] = [0, 0];
    let score = 0;
    for (let r = 0; r < H; r++) {
      for (let f = 0; f < W; f++) {
        const p = pos.board[pos.sq(f, r)]!;
        if (p <= 0) continue;
        const type = pieceType(p);
        const color = pieceColor(p);
        if (type === PAWN) pawns[color]++;
        else if (type !== KING) heavy[color] += VALUE[type]!;
        if (type === KING && !anti) continue; // kings are scored below, once the phase is known
        let v = anti ? 100 : VALUE[type]!;
        if (W === 8 && !anti) v += PST[type]![color === 0 ? (7 - r) * 8 + f : r * 8 + f]!;
        else v += 6 - centerDistance(f, r, W, H) * 3;
        score += color === pos.side ? v : -v;
      }
    }
    const endgame = heavy[0] + heavy[1] <= 1600;
    if (!anti)
      for (const color of [0, 1] as Color[]) {
        const k = pos.kings[color];
        if (k < 0) continue;
        const f = pos.fileOf(k);
        const r = pos.rankOf(k);
        let v =
          W === 8 && !endgame
            ? PST[KING]![color === 0 ? (7 - r) * 8 + f : r * 8 + f]!
            : 30 - centerDistance(f, r, W, H) * 10;
        if (this.variant.goal === 'king-of-the-hill')
          v += (4 - Math.max(Math.abs(f - 3.5), Math.abs(r - 3.5))) * 60;
        score += color === pos.side ? v : -v;
      }
    // In Antichess fewer pieces (and fewer targets for the opponent) is better.
    if (anti) return -score;
    if (this.variant.goal === 'three-check')
      score += (this.checks[pos.side] - this.checks[(1 - pos.side) as Color]) * 150;
    // Mop-up: with a decisive material edge and no pawns left to defend, drive the bare king to
    // the edge and bring the own king closer so the win is actually converted.
    for (const strong of [0, 1] as Color[]) {
      const weak = (1 - strong) as Color;
      if (pawns[weak] > 0 || heavy[strong] - heavy[weak] < 400 || heavy[weak] > 330) continue;
      const wk = pos.kings[weak];
      const sk = pos.kings[strong];
      if (wk < 0 || sk < 0) continue;
      const edge = centerDistance(pos.fileOf(wk), pos.rankOf(wk), W, H) * 10;
      const close =
        (14 -
          Math.abs(pos.fileOf(wk) - pos.fileOf(sk)) -
          Math.abs(pos.rankOf(wk) - pos.rankOf(sk))) *
        4;
      score += (strong === pos.side ? 1 : -1) * (edge + close);
    }
    return score;
  }

  private moveKey(m: Move): number {
    return m.from * 4096 + m.to * 16 + (m.promo & 15);
  }

  private ordered(_pos: Position, moves: Move[], ply: number, ttBest: number): Move[] {
    const killers = this.killers[ply] ?? [];
    const score = (m: Move) => {
      const k = this.moveKey(m);
      if (k === ttBest) return 1e9;
      if (m.captured !== EMPTY)
        return 1e6 + VALUE[pieceType(m.captured)]! * 10 - VALUE[pieceType(m.piece)]!;
      if (m.promo) return 9e5;
      if (killers.includes(k)) return 5e5;
      return 0;
    };
    return moves.slice().sort((a, b) => score(b) - score(a));
  }

  /** Pseudo-legal moves filtered for legality inline (one make per move), with compulsory captures in Antichess. */
  private children(pos: Position): Move[] {
    const pseudo = pos.pseudoMoves();
    if (this.variant.goal === 'antichess') {
      const caps = pseudo.filter((m) => m.captured !== EMPTY);
      return caps.length ? caps : pseudo;
    }
    return pseudo;
  }

  private tick() {
    this.nodes++;
    if (
      (this.nodes & 2047) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
  }

  private negamax(pos: Position, depth: number, alpha: number, beta: number, ply: number): number {
    this.tick();
    const key = pos.key();
    // Repetition within the search path counts as a draw.
    for (let i = this.path.length - 3; i >= 0; i -= 2) if (this.path[i] === key) return 0;
    if (pos.halfmove >= 100) return 0;
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
    for (const m of this.ordered(pos, this.children(pos), ply, entry?.best ?? -1)) {
      const u = this.makeTracked(pos, m);
      if (!this.variant.rules.antichess && pos.inCheck(me)) {
        this.unmakeTracked(pos, m, u);
        continue;
      }
      legalCount++;
      const v = this.variantWin(pos) ?? -this.negamax(pos, depth - 1, -beta, -alpha, ply + 1);
      this.unmakeTracked(pos, m, u);
      if (v > best) {
        best = v;
        bestMove = this.moveKey(m);
      }
      if (v > alpha) alpha = v;
      if (alpha >= beta) {
        if (m.captured === EMPTY) {
          const k = (this.killers[ply] ??= []);
          if (!k.includes(bestMove)) {
            k.unshift(bestMove);
            k.length = Math.min(k.length, 2);
          }
        }
        break;
      }
    }
    if (legalCount === 0) {
      if (this.variant.goal === 'antichess') return MATE - ply; // no moves: the side to move wins
      return pos.inCheck(me) ? -(MATE - ply) : 0;
    }
    const bound = best <= alphaOrig ? Bound.Upper : best >= beta ? Bound.Lower : Bound.Exact;
    if (this.table.size > 400_000) this.table.clear();
    this.table.set(key, { depth, value: best, bound, best: bestMove });
    return best;
  }

  private quiesce(pos: Position, alpha: number, beta: number, ply: number, qdepth: number): number {
    this.tick();
    const me = pos.side;
    const inCheck = !this.variant.rules.antichess && pos.inCheck(me);
    const stand = this.evaluate(pos);
    if (!inCheck) {
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      if (qdepth > 6) return stand;
    }
    let legalCount = 0;
    const moves = this.children(pos).filter(
      (m) => inCheck || m.captured !== EMPTY || m.promo !== 0 || this.variant.goal === 'antichess',
    );
    let best = inCheck ? -Infinity : stand;
    for (const m of this.ordered(pos, moves, ply, -1)) {
      if (this.variant.goal === 'antichess' && m.captured === EMPTY && !inCheck && qdepth > 0)
        continue;
      if (m.flags & FLAG_CASTLE) continue;
      const u = this.makeTracked(pos, m);
      if (!this.variant.rules.antichess && pos.inCheck(me)) {
        this.unmakeTracked(pos, m, u);
        continue;
      }
      legalCount++;
      const v = this.variantWin(pos) ?? -this.quiesce(pos, -beta, -alpha, ply + 1, qdepth + 1);
      this.unmakeTracked(pos, m, u);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    if (inCheck && legalCount === 0) return -(MATE - ply);
    return best;
  }
}
