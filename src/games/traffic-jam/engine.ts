/**
 * Traffic Jam rules and solver. Cars (two cells) and trucks (three) sit on a 6×6 grid and slide
 * only along their length; free the red car (vehicle A, on the third row) through the gap in the
 * right wall. A move slides one vehicle any distance. Puzzles come from `puzzles.ts`, generated
 * offline by this project's generator (random layouts, the whole space of reachable positions
 * explored, the position farthest from a free exit kept), each with its fewest-move count.
 */
import { Rng } from '../../core/game-engine/random';
import { PUZZLES } from './puzzles';

export const SIZE = 6;
export const EXIT_ROW = 2;

export interface Vehicle {
  /** Fixed line: the row of a horizontal vehicle, the column of a vertical one. */
  line: number;
  horizontal: boolean;
  length: number;
}

export interface JamPuzzle {
  vehicles: Vehicle[];
  start: number[];
  optimal: number;
}

export const cellsOf = (v: Vehicle, at: number) =>
  Array.from({ length: v.length }, (_, i) =>
    v.horizontal ? v.line * SIZE + at + i : (at + i) * SIZE + v.line,
  );

/** Reads a 36-character board ('o' empty, 'A' the red car, other letters vehicles). */
export function parseBoard(board: string, optimal: number): JamPuzzle {
  const ids = [...new Set(board.replace(/o/g, ''))].sort();
  const vehicles: Vehicle[] = [];
  const start: number[] = [];
  for (const id of ids) {
    const cells = [...board].flatMap((ch, c) => (ch === id ? [c] : []));
    const horizontal = cells[1]! - cells[0]! === 1;
    vehicles.push({
      line: horizontal ? Math.floor(cells[0]! / SIZE) : cells[0]! % SIZE,
      horizontal,
      length: cells.length,
    });
    start.push(horizontal ? cells[0]! % SIZE : Math.floor(cells[0]! / SIZE));
  }
  return { vehicles, start, optimal };
}

export const LEVELS = ['easy', 'medium', 'hard'] as const;

export function puzzleFor(level: string, seed: number): JamPuzzle {
  const list = PUZZLES[level as keyof typeof PUZZLES] ?? PUZZLES.easy;
  const [board, moves] = list[new Rng(seed >>> 0).int(list.length)]!.split(':') as [string, string];
  return parseBoard(board, Number(moves));
}

/** Vehicle index per cell, -1 when empty. */
export function grid(vehicles: readonly Vehicle[], pos: readonly number[]): number[] {
  const g = new Array<number>(SIZE * SIZE).fill(-1);
  vehicles.forEach((v, i) => cellsOf(v, pos[i]!).forEach((c) => (g[c] = i)));
  return g;
}

/** Every slide available: [vehicle, new start]. */
export function slides(vehicles: readonly Vehicle[], pos: readonly number[]): [number, number][] {
  const g = grid(vehicles, pos);
  const out: [number, number][] = [];
  vehicles.forEach((v, i) => {
    const at = pos[i]!;
    const cell = (k: number) => (v.horizontal ? v.line * SIZE + k : k * SIZE + v.line);
    for (let k = at - 1; k >= 0 && g[cell(k)] === -1; k--) out.push([i, k]);
    for (let k = at + v.length; k < SIZE && g[cell(k)] === -1; k++) out.push([i, k - v.length + 1]);
  });
  return out;
}

/** The range a vehicle can occupy from where it is: [lowest start, highest start]. */
export function range(vehicles: readonly Vehicle[], pos: readonly number[], i: number) {
  let lo = pos[i]!;
  let hi = pos[i]!;
  for (const [j, to] of slides(vehicles, pos))
    if (j === i) {
      lo = Math.min(lo, to);
      hi = Math.max(hi, to);
    }
  return [lo, hi] as const;
}

export const isFree = (pos: readonly number[]) => pos[0] === SIZE - 2;

/** Fewest-move solution by breadth-first search, or null when the car cannot get out. */
export function solve(
  vehicles: readonly Vehicle[],
  pos: readonly number[],
): [number, number][] | null {
  if (isFree(pos)) return [];
  const key = (p: readonly number[]) => p.join(',');
  const seen = new Map<string, { prev: string; move: [number, number] } | null>([[key(pos), null]]);
  let frontier: number[][] = [[...pos]];
  while (frontier.length && seen.size < 400_000) {
    const next: number[][] = [];
    for (const p of frontier)
      for (const [i, to] of slides(vehicles, p)) {
        const q = [...p];
        q[i] = to;
        const k = key(q);
        if (seen.has(k)) continue;
        seen.set(k, { prev: key(p), move: [i, to] });
        if (isFree(q)) {
          const moves: [number, number][] = [];
          for (let at = k; seen.get(at); at = seen.get(at)!.prev) moves.push(seen.get(at)!.move);
          return moves.reverse();
        }
        next.push(q);
      }
    frontier = next;
  }
  return null;
}

export interface JamState {
  level: string;
  seed: number;
  puzzle: JamPuzzle;
  pos: number[];
  /** Earlier positions, for undo. */
  history: number[][];
  moves: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newJam(level: string, seed: number): JamState {
  const lv = (LEVELS as readonly string[]).includes(level) ? level : 'easy';
  const puzzle = puzzleFor(lv, seed);
  return {
    level: lv,
    seed: seed >>> 0,
    puzzle,
    pos: [...puzzle.start],
    history: [],
    moves: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

/** Slides vehicle `i` to start `to` when the way is clear. */
export function move(
  s: JamState,
  i: number,
  to: number,
  options: { hint?: boolean } = {},
): JamState {
  if (s.solved || to === s.pos[i]) return s;
  if (!slides(s.puzzle.vehicles, s.pos).some(([j, k]) => j === i && k === to)) return s;
  const pos = [...s.pos];
  pos[i] = to;
  return {
    ...s,
    pos,
    history: [...s.history, s.pos].slice(-300),
    moves: s.moves + 1,
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isFree(pos),
  };
}

export function undo(s: JamState): JamState {
  const prev = s.history[s.history.length - 1];
  if (s.solved || !prev) return s;
  return { ...s, pos: prev, history: s.history.slice(0, -1), moves: s.moves + 1 };
}

export function isValidJamState(d: unknown): d is JamState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as JamState;
  if (!(LEVELS as readonly string[]).includes(s.level)) return false;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0) return false;
  if (!Number.isInteger(s.hints) || s.hints < 0 || !Number.isInteger(s.moves) || s.moves < 0)
    return false;
  if (typeof s.solved !== 'boolean') return false;
  const fresh = puzzleFor(s.level, s.seed);
  if (JSON.stringify(fresh) !== JSON.stringify(s.puzzle)) return false;
  const ok = (p: unknown): p is number[] => {
    if (!Array.isArray(p) || p.length !== fresh.vehicles.length) return false;
    if (!p.every((x, i) => Number.isInteger(x) && x >= 0 && x + fresh.vehicles[i]!.length <= SIZE))
      return false;
    return (
      new Set(fresh.vehicles.flatMap((v, i) => cellsOf(v, p[i] as number))).size ===
      fresh.vehicles.reduce((n, v) => n + v.length, 0)
    );
  };
  if (!ok(s.pos) || !Array.isArray(s.history) || !s.history.every(ok)) return false;
  return s.solved === isFree(s.pos);
}
