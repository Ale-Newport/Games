/**
 * Shogi-family opponent on the shared `ShogiPosition`: negamax alpha-beta with quiescence on
 * captures, transposition table, MVV-LVA + killer ordering, iterative deepening under a time
 * budget, repetition awareness, and variant terminals (royal capture and "try" for animal shogi).
 */
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../../ai/protocols/types';
import { positionOf, type ShogiState } from './game';
import { moveAction, type Owner, type ShogiMove, type ShogiPosition } from './position';
import type { ShogiVariant } from './variants';

const MATE = 1_000_000;
const MATE_BOUND = MATE - 10_000;

const enum Bound {
  Exact,
  Lower,
  Upper,
}

class Timeout extends Error {}

export interface ShogiSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  randomness?: number;
  now?: () => number;
}

export class ShogiSearchAgent implements Agent<ShogiState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;
  private table = new Map<number, { depth: number; value: number; bound: Bound; best: number }>();
  private killers: number[][] = [];
  private path: number[] = [];

  constructor(
    private readonly variant: ShogiVariant,
    private readonly options: ShogiSearchOptions,
  ) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<ShogiState, string>,
    state: ShogiState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 0) throw new Error('ShogiSearchAgent: no legal moves');
    if (legal.length === 1) return legal[0]!;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return ctx.rng.pick(legal);
    const pos = positionOf(this.variant, state);
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
        const scores = new Map<ShogiMove, number>();
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
    return moveAction(pos, best);
  }

  // ---- terminals and evaluation ------------------------------------------------------------
  private onFarRow(pos: ShogiPosition, o: Owner) {
    const k = pos.kings[o];
    return k >= 0 && pos.farDistance(Math.floor(k / pos.cols), o) === 0;
  }

  /** Result for the side to move in royal-capture variants, or null while the game goes on. */
  private captureTerminal(pos: ShogiPosition, ply: number): number | null {
    const me = pos.side;
    const them = (1 - me) as Owner;
    if (pos.kings[me] < 0) return -(MATE - ply);
    if (this.variant.tryRule) {
      if (this.onFarRow(pos, me)) return MATE - ply; // survived a full turn on the far row
      if (this.onFarRow(pos, them) && !pos.isAttacked(pos.kings[them], me)) return -(MATE - ply);
    }
    return null;
  }

  private evaluate(pos: ShogiPosition): number {
    const v = this.variant;
    const me = pos.side;
    let score = 0;
    const { rows, cols } = pos;
    for (let sq = 0; sq < pos.board.length; sq++) {
      const code = pos.board[sq]!;
      if (code === 0) continue;
      const def = v.kinds[Math.abs(code)]!;
      const owner: Owner = code > 0 ? 0 : 1;
      let value = def.value;
      // Advanced pieces press the enemy camp; royal pieces in try variants race forward.
      const advance = rows - 1 - pos.farDistance(Math.floor(sq / cols), owner);
      if (def.royal) value += v.tryRule ? advance * 40 : 0;
      else if (!def.royal) value += advance * 4;
      score += owner === me ? value : -value;
    }
    for (const o of [0, 1] as Owner[])
      for (let k = 1; k < v.kinds.length; k++) {
        const n = pos.hands[o][k]!;
        if (n) score += (o === me ? 1 : -1) * n * Math.round(v.kinds[k]!.value * 1.15);
      }
    // King shelter: own pieces next to the own king.
    for (const o of [0, 1] as Owner[]) {
      const k = pos.kings[o];
      if (k < 0 || v.goal !== 'checkmate') continue;
      const r0 = Math.floor(k / cols);
      const c0 = k % cols;
      let guards = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          if ((dr || dc) && r >= 0 && r < rows && c >= 0 && c < cols) {
            const code = pos.board[r * cols + c]!;
            if (code !== 0 && (code > 0 ? 0 : 1) === o) guards++;
          }
        }
      score += (o === me ? 1 : -1) * guards * 25;
    }
    return score;
  }

  // ---- search ------------------------------------------------------------------------------
  private moveKey(m: ShogiMove): number {
    return ((m.from + 1) * 128 + m.to) * 32 + m.kind * 2 + (m.promote ? 1 : 0);
  }

  private ordered(moves: ShogiMove[], ply: number, ttBest: number): ShogiMove[] {
    const kinds = this.variant.kinds;
    const killers = this.killers[ply] ?? [];
    const score = (m: ShogiMove) => {
      const k = this.moveKey(m);
      if (k === ttBest) return 1e9;
      if (m.captured) return 1e6 + kinds[Math.abs(m.captured)]!.value * 10 - kinds[m.kind]!.value;
      if (m.promote) return 9e5;
      if (killers.includes(k)) return 5e5;
      return m.from < 0 ? -1 : 0;
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

  /** Makes `m` if it is legal here (own king safe, no pawn-drop mate); returns null otherwise. */
  private tryMake(pos: ShogiPosition, m: ShogiMove) {
    const v = this.variant;
    const me = pos.side;
    if (v.uchifuzume && m.from < 0 && m.kind === v.pawnKind) {
      const k = pos.kings[(1 - me) as Owner];
      const front = m.to + (me === 0 ? -pos.cols : pos.cols);
      if (k === front && pos.isPawnDropMate(m)) return null;
    }
    const u = pos.make(m);
    if (v.goal === 'checkmate' && pos.inCheck(me)) {
      pos.unmake(m, u);
      return null;
    }
    return u;
  }

  private negamax(
    pos: ShogiPosition,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
  ): number {
    this.tick();
    if (this.variant.goal === 'capture') {
      const t = this.captureTerminal(pos, ply);
      if (t !== null) return t;
    }
    const key = pos.key();
    for (let i = this.path.length - 3; i >= 0; i -= 2) if (this.path[i] === key) return 0;
    if (depth <= 0) return this.quiesce(pos, alpha, beta, ply, 0);
    const entry = this.table.get(key);
    if (entry && entry.depth >= depth) {
      if (entry.bound === Bound.Exact) return entry.value;
      if (entry.bound === Bound.Lower && entry.value >= beta) return entry.value;
      if (entry.bound === Bound.Upper && entry.value <= alpha) return entry.value;
    }
    const alphaOrig = alpha;
    let best = -Infinity;
    let bestMove = -1;
    let legalCount = 0;
    for (const m of this.ordered(pos.pseudoMoves(), ply, entry?.best ?? -1)) {
      const u = this.tryMake(pos, m);
      if (!u) continue;
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
    if (legalCount === 0) return -(MATE - ply); // mated (or stuck): the side to move loses
    const bound = best <= alphaOrig ? Bound.Upper : best >= beta ? Bound.Lower : Bound.Exact;
    if (this.table.size > 300_000) this.table.clear();
    this.table.set(key, { depth, value: best, bound, best: bestMove });
    return best;
  }

  private quiesce(pos: ShogiPosition, alpha: number, beta: number, ply: number, qdepth: number) {
    this.tick();
    if (this.variant.goal === 'capture') {
      const t = this.captureTerminal(pos, ply);
      if (t !== null) return t;
    }
    const stand = this.evaluate(pos);
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    if (qdepth > 6) return stand;
    let best = stand;
    const captures = pos.pseudoMoves().filter((m) => m.captured !== 0);
    for (const m of this.ordered(captures, ply, -1)) {
      const u = this.tryMake(pos, m);
      if (!u) continue;
      const v = -this.quiesce(pos, -beta, -alpha, ply + 1, qdepth + 1);
      pos.unmake(m, u);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
}
