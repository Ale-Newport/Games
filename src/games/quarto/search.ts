/**
 * Quarto opponent: negamax alpha-beta over whole turns (place the piece in hand + choose the next
 * piece), iterative deepening under a time budget. Winning placements are tried first and pieces
 * that would hand the opponent an immediate win are only given when nothing else is left. The
 * leaf evaluation counts the "safe" pieces still available (pieces with no winning cell).
 */
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { LINES, available, type QuartoState } from './engine';

const WIN = 1_000_000;

class Timeout extends Error {}

/** Whether placing `piece` somewhere on `board` completes a line. */
function winsSomewhere(board: Int8Array, piece: number): number {
  for (let c = 0; c < 16; c++) {
    if (board[c] !== -1) continue;
    board[c] = piece;
    const win = lineAt(board, c);
    board[c] = -1;
    if (win) return c;
  }
  return -1;
}

function lineAt(board: Int8Array, c: number): boolean {
  for (const line of LINES) {
    if (!line.includes(c)) continue;
    let all = 15;
    let none = 0;
    let full = true;
    for (const q of line) {
      const p = board[q]!;
      if (p < 0) {
        full = false;
        break;
      }
      all &= p;
      none |= p;
    }
    if (full && (all !== 0 || none !== 15)) return true;
  }
  return false;
}

export interface QuartoSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  randomness?: number;
  now?: () => number;
}

export class QuartoSearchAgent implements Agent<QuartoState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;

  constructor(private readonly options: QuartoSearchOptions) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<QuartoState, string>,
    state: QuartoState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 1) return legal[0]!;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return ctx.rng.pick(legal);
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    const budget = limits.length ? Math.min(...limits) : undefined;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    const board = Int8Array.from(state.board);
    const pool = available(state);
    let best = legal[0]!;
    let bestValue = 0;
    let reached = 0;
    // The opening give: any piece is equivalent on an empty board.
    if (state.inHand < 0) return ctx.rng.pick(legal);
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        const r = this.turn(
          board,
          state.inHand,
          pool,
          depth,
          -Infinity,
          Infinity,
          ctx.rng.int(16),
          true,
        );
        best = r.action;
        bestValue = r.value;
        reached = depth;
        if (Math.abs(r.value) >= WIN - 100) break;
      } catch (error) {
        if (error instanceof Timeout) break;
        throw error;
      }
      if (now() >= this.deadline) break;
    }
    this.lastStats = { nodes: this.nodes, depth: reached, value: bestValue };
    return best;
  }

  /** Best (place, give) for the side holding `piece`; value from that side's perspective. */
  private turn(
    board: Int8Array,
    piece: number,
    pool: number[],
    depth: number,
    alpha: number,
    beta: number,
    salt: number,
    root = false,
  ): { value: number; action: string } {
    this.nodes++;
    if (
      (this.nodes & 1023) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
    const win = winsSomewhere(board, piece);
    if (win >= 0) return { value: WIN + depth, action: String(win) };
    const empties: number[] = [];
    for (let c = 0; c < 16; c++) if (board[c] === -1) empties.push(c);
    if (pool.length === 0) return { value: 0, action: String(empties[0]) }; // last piece: draw
    let bestValue = -Infinity;
    let bestAction = '';
    // Rotate the scan by a salt so equal moves are not always resolved the same way.
    for (let k = 0; k < empties.length; k++) {
      const c = empties[(k + salt) % empties.length]!;
      board[c] = piece;
      const safe = pool.filter((p) => winsSomewhere(board, p) < 0);
      const gives = safe.length ? safe : pool; // giving an unsafe piece loses at once
      for (const give of gives) {
        let value: number;
        if (!safe.length) value = -(WIN + depth - 1);
        else if (depth <= 1) value = this.evaluate(board, pool, give);
        else {
          const rest = pool.filter((p) => p !== give);
          value = -this.turn(board, give, rest, depth - 1, -beta, -alpha, salt).value;
        }
        if (value > bestValue) {
          bestValue = value;
          bestAction = `${c}:give:${give}`;
        }
        if (value > alpha) alpha = value;
        if (alpha >= beta) break;
      }
      board[c] = -1;
      if (alpha >= beta) break;
      if (!root && bestValue >= WIN - 100) break;
    }
    return { value: bestValue, action: bestAction };
  }

  /** After placing and giving `give`: more safe pieces left for us to give later is good. */
  private evaluate(board: Int8Array, pool: number[], give: number): number {
    let safe = 0;
    for (const p of pool) if (p !== give && winsSomewhere(board, p) < 0) safe++;
    return safe * 10 - pool.length;
  }
}
