/** Twisty cube game state: scrambles by level, turns with undo, hints, and save validation by replay. */
import {
  isSolvedCube,
  moveName,
  parseMove,
  scramble,
  solvedCube,
  turn,
  type Cube,
  type Turn,
} from './cube';

export interface CubeSpec {
  size: number;
  /** Random turns in the scramble. */
  scramble: number;
}

export interface CubeState {
  level: string;
  seed: number;
  size: number;
  /** The scramble and the player's turns, in move notation. */
  scrambleMoves: string[];
  moves: string[];
  cube: Cube;
  hints: number;
  undos: number;
  elapsedMs: number;
  solved: boolean;
}

export function applyAll(n: number, moves: readonly string[], from = solvedCube(n)): Cube {
  let c = from;
  for (const m of moves) c = turn(c, n, parseMove(m)!);
  return c;
}

export function newCube(specs: Record<string, CubeSpec>, level: string, seed: number): CubeState {
  const lv = specs[level] ? level : Object.keys(specs)[0]!;
  const spec = specs[lv]!;
  let moves = scramble(spec.size, seed, spec.scramble).map(moveName);
  // A scramble that happens to leave the cube solved gets one more turn.
  if (isSolvedCube(applyAll(spec.size, moves))) moves = [...moves, 'R'];
  return {
    level: lv,
    seed: seed >>> 0,
    size: spec.size,
    scrambleMoves: moves,
    moves: [],
    cube: applyAll(spec.size, moves),
    hints: 0,
    undos: 0,
    elapsedMs: 0,
    solved: false,
  };
}

export function play(s: CubeState, t: Turn, options: { hint?: boolean } = {}): CubeState {
  if (s.solved) return s;
  if (t.depth > 1 && s.size < 4) return s;
  const cube = turn(s.cube, s.size, t);
  return {
    ...s,
    cube,
    moves: [...s.moves, moveName(t)],
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSolvedCube(cube),
  };
}

export function undo(s: CubeState): CubeState {
  const last = s.moves[s.moves.length - 1];
  if (!last || s.solved) return s;
  const t = parseMove(last)!;
  return {
    ...s,
    cube: turn(s.cube, s.size, { ...t, amount: (4 - t.amount) as 1 | 2 | 3 }),
    moves: s.moves.slice(0, -1),
    undos: s.undos + 1,
  };
}

export function isValidCubeState(d: unknown, specs: Record<string, CubeSpec>): d is CubeState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as CubeState;
  const spec = specs[s.level];
  if (!spec || s.size !== spec.size) return false;
  if (!Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  for (const k of ['hints', 'undos'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0 || typeof s.solved !== 'boolean')
    return false;
  const fresh = newCube(specs, s.level, s.seed);
  if (JSON.stringify(fresh.scrambleMoves) !== JSON.stringify(s.scrambleMoves)) return false;
  if (!Array.isArray(s.moves) || !s.moves.every((m) => typeof m === 'string' && parseMove(m)))
    return false;
  if (s.moves.some((m) => parseMove(m)!.depth > 1 && s.size < 4)) return false;
  const cube = applyAll(s.size, s.moves, fresh.cube);
  return JSON.stringify(cube) === JSON.stringify(s.cube) && s.solved === isSolvedCube(cube);
}
