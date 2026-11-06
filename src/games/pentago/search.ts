/**
 * Pentago opponent: negamax alpha-beta over (place, twist) moves on raw boards (no immutable
 * states inside the search), iterative deepening under a time budget, children ordered by the
 * static evaluation and limited to the best `beam` below the root. Immediate wins are taken;
 * leaves are scored by open lines of five, weighted by how many marbles they already hold.
 */
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import { LINES5, twist, type PentagoState } from './engine';

const WIN = 1_000_000;
const WEIGHT = [0, 1, 6, 40, 300, 0];

class Timeout extends Error {}

/** Lines through each cell, for the "five right after placing" check. */
const LINES_AT: number[][][] = Array.from({ length: 36 }, (_, p) =>
  LINES5.filter((l) => l.includes(p)).map((l) => [...l]),
);

/** Open-line score of the board for `color` minus the opponent's. */
export function pentagoEval(board: readonly number[], color: number): number {
  let score = 0;
  for (const line of LINES5) {
    let mine = 0;
    let theirs = 0;
    for (const p of line) {
      const v = board[p];
      if (v === color) mine++;
      else if (v !== 0) theirs++;
    }
    if (theirs === 0) score += WEIGHT[mine]!;
    else if (mine === 0) score -= WEIGHT[theirs]!;
  }
  return score;
}

const hasFive = (board: readonly number[], color: number, lines: readonly (readonly number[])[]) =>
  lines.some((l) => l.every((p) => board[p] === color));

interface Child {
  board: number[];
  move: string;
  /** Terminal value for the mover (WIN, −WIN, 0 draw) or null. */
  terminal: number | null;
  key: number;
}

/** Every (place, twist) child of `board` for `color`, with immediate results resolved. */
function children(board: readonly number[], color: number): Child[] {
  const out: Child[] = [];
  const enemy = 3 - color;
  for (let p = 0; p < 36; p++) {
    if (board[p] !== 0) continue;
    const placed = board.slice();
    placed[p] = color;
    if (hasFive(placed, color, LINES_AT[p]!)) {
      out.push({ board: placed, move: String(p), terminal: WIN, key: -Infinity });
      continue;
    }
    for (let q = 0; q < 4; q++)
      for (const cw of [true, false]) {
        const next = twist(placed, q, cw);
        const mine = hasFive(next, color, LINES5);
        const theirs = hasFive(next, enemy, LINES5);
        const full = next.every((v) => v !== 0);
        const terminal = mine && theirs ? 0 : mine ? WIN : theirs ? -WIN : full ? 0 : null;
        out.push({
          board: next,
          move: `${p}:${q}${cw ? 'R' : 'L'}`,
          terminal,
          // Ascending sort: lower key = better for the mover (the opponent's view is negated).
          key: terminal === null ? pentagoEval(next, enemy) : -terminal,
        });
      }
  }
  return out.sort((a, b) => a.key - b.key);
}

export interface PentagoSearchOptions {
  id: string;
  label: string;
  maxDepth: number;
  timeLimitMs?: number;
  /** Children searched below the root at each node (best by static value). */
  beam?: number;
  randomness?: number;
  now?: () => number;
}

export class PentagoSearchAgent implements Agent<PentagoState, string> {
  readonly id: string;
  readonly label: string;
  lastStats?: DecisionStats;
  private nodes = 0;
  private deadline = Infinity;

  constructor(private readonly options: PentagoSearchOptions) {
    this.id = options.id;
    this.label = options.label;
  }

  selectAction(
    env: GameEnvironment<PentagoState, string>,
    state: PentagoState,
    player: PlayerId,
    ctx: DecisionContext,
  ): string {
    const legal = env.getLegalActions(state, player);
    if (legal.length === 1) return legal[0]!;
    const winning = legal.find((a) => !a.includes(':'));
    if (winning) return winning;
    if (this.options.randomness && ctx.rng.chance(this.options.randomness))
      return ctx.rng.pick(legal);
    const now = this.options.now ?? (() => performance.now());
    const limits = [ctx.timeLimitMs, this.options.timeLimitMs].filter((n) => n !== undefined);
    const budget = limits.length ? Math.min(...limits) : undefined;
    this.deadline = budget === undefined ? Infinity : now() + budget;
    this.nodes = 0;
    const color = state.toMove + 1;
    // Shuffle first so ties among equal moves vary, then order by static value.
    const shuffled = ctx.rng.shuffle(children(state.board, color));
    let order = shuffled.sort((a, b) => a.key - b.key);
    let best = order[0]!.move;
    let bestValue = 0;
    let reached = 0;
    for (let depth = 1; depth <= this.options.maxDepth; depth++) {
      try {
        let alpha = -Infinity;
        let iterationBest = order[0]!;
        const scores = new Map<Child, number>();
        for (const ch of order) {
          const v =
            ch.terminal !== null
              ? ch.terminal
              : -this.negamax(ch.board, 3 - color, depth - 1, -Infinity, -alpha, 1);
          scores.set(ch, v);
          if (v > alpha) {
            alpha = v;
            iterationBest = ch;
          }
        }
        best = iterationBest.move;
        bestValue = alpha;
        reached = depth;
        order = [...order].sort((a, b) => scores.get(b)! - scores.get(a)!);
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

  /** Value of `board` for `color` to move. */
  private negamax(
    board: number[],
    color: number,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
  ): number {
    this.nodes++;
    if (
      (this.nodes & 255) === 0 &&
      (this.options.now ?? (() => performance.now()))() > this.deadline
    )
      throw new Timeout();
    if (depth <= 0) return pentagoEval(board, color);
    const kids = children(board, color);
    if (kids.length === 0) return 0;
    let best = -Infinity;
    const limit = this.options.beam ?? kids.length;
    for (let i = 0; i < kids.length && i < limit; i++) {
      const ch = kids[i]!;
      const v =
        ch.terminal !== null
          ? ch.terminal === 0
            ? 0
            : Math.sign(ch.terminal) * (WIN - ply)
          : -this.negamax(ch.board, 3 - color, depth - 1, -beta, -alpha, ply + 1);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
}
