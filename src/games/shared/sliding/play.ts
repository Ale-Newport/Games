/**
 * Sliding puzzle games: levels (a scramble by a random walk of the gap, or a random solvable
 * board), the play state with move count, undo and hints, and save validation by replay.
 */
import { isSolvedBoard, lineTo, scramble, slide, solve, solveOptimal, type Board } from './engine';

export interface SlideSpec {
  size: number;
  /** Random gap moves for the scramble; undefined for a random solvable board. */
  walk?: number;
}

export interface SlideState {
  level: string;
  seed: number;
  size: number;
  start: Board;
  board: Board;
  /** Tiles slid so far, for undo. */
  history: number[];
  /** Every slide counts, undos included. */
  moves: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
  /** The fewest moves from the start, when the exact solver found it. */
  optimal: number | null;
}

export function newSlide(
  specs: Record<string, SlideSpec>,
  level: string,
  seed: number,
): SlideState {
  const lv = specs[level] ? level : Object.keys(specs)[0]!;
  const spec = specs[lv]!;
  const start = scramble(spec.size, seed, spec.walk);
  const exact = solveOptimal(start, spec.size === 3 ? 5_000_000 : 60_000);
  return {
    level: lv,
    seed: seed >>> 0,
    size: spec.size,
    start,
    board: [...start],
    history: [],
    moves: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
    optimal: exact.moves?.length ?? null,
  };
}

/** Slides `tile` and any tiles between it and the gap (same row or column). */
export function push(s: SlideState, tile: number, options: { hint?: boolean } = {}): SlideState {
  if (s.solved) return s;
  const line = lineTo(s.board, tile);
  if (!line.length) return s;
  let board = s.board;
  for (const t of line) board = slide(board, t);
  return {
    ...s,
    board,
    history: [...s.history, ...line],
    moves: s.moves + line.length,
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSolvedBoard(board),
  };
}

export function undo(s: SlideState): SlideState {
  const last = s.history[s.history.length - 1];
  if (s.solved || last === undefined) return s;
  return {
    ...s,
    board: slide(s.board, last),
    history: s.history.slice(0, -1),
    moves: s.moves + 1,
  };
}

const plans = new Map<string, number[]>();

/** The solver's next tile: a cached plan when the board is on it, else a fresh solve. */
export function nextMove(board: readonly number[]): {
  tile: number;
  left: number;
  optimal: boolean;
} {
  const key = board.join(',');
  let plan = plans.get(key);
  let optimal = true;
  if (!plan) {
    const r = solve(board);
    plan = r.moves;
    optimal = r.optimal;
    if (plans.size > 2000) plans.clear();
    let b = [...board];
    for (let i = 0; i < plan.length; i++) {
      plans.set(b.join(','), plan.slice(i));
      b = slide(b, plan[i]!);
    }
  }
  return { tile: plan[0]!, left: plan.length, optimal };
}

export function isValidSlideState(d: unknown, specs: Record<string, SlideSpec>): d is SlideState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as SlideState;
  const spec = specs[s.level];
  if (!spec || s.size !== spec.size) return false;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0) return false;
  if (!Number.isInteger(s.hints) || s.hints < 0 || !Number.isInteger(s.moves)) return false;
  if (typeof s.solved !== 'boolean') return false;
  if (s.optimal !== null && !Number.isInteger(s.optimal)) return false;
  const start = scramble(spec.size, s.seed, spec.walk);
  if (!Array.isArray(s.start) || s.start.join() !== start.join()) return false;
  if (!Array.isArray(s.history) || s.moves < s.history.length) return false;
  let b = start;
  for (const t of s.history) {
    const next = slide(b, t);
    if (next.join() === b.join()) return false;
    b = next;
  }
  return Array.isArray(s.board) && b.join() === s.board.join() && s.solved === isSolvedBoard(b);
}
