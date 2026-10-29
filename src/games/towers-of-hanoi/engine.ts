/**
 * Towers of Hanoi rules and solver. Move the whole stack of disks to the last peg, one top disk at
 * a time, never placing a disk on a smaller one. With three pegs the fewest moves is 2ⁿ − 1; with
 * four (the Reve's puzzle) it is smaller. The solver is a breadth-first table over every position
 * (pegᵏ positions for k pegs), so hints are exact from anywhere.
 */

export interface HanoiSpec {
  disks: number;
  pegs: number;
}

export const SPECS: Record<string, HanoiSpec> = {
  three: { disks: 3, pegs: 3 },
  five: { disks: 5, pegs: 3 },
  seven: { disks: 7, pegs: 3 },
  four: { disks: 6, pegs: 4 },
};

/** Position: the peg of each disk, smallest disk first. */
export type Position = number[];

export const encode = (p: readonly number[], pegs: number) =>
  p.reduceRight((k, peg) => k * pegs + peg, 0);
export function decode(k: number, disks: number, pegs: number): Position {
  const out: number[] = [];
  for (let i = 0; i < disks; i++) {
    out.push(k % pegs);
    k = Math.floor(k / pegs);
  }
  return out;
}

/** Top disk of each peg (-1 when empty). */
export function tops(p: readonly number[], pegs: number): number[] {
  const out = new Array<number>(pegs).fill(-1);
  for (let d = p.length - 1; d >= 0; d--) out[p[d]!] = d;
  return out;
}

/** Every legal move as [from, to]. */
export function legalMoves(p: readonly number[], pegs: number): [number, number][] {
  const top = tops(p, pegs);
  const out: [number, number][] = [];
  for (let a = 0; a < pegs; a++)
    for (let b = 0; b < pegs; b++)
      if (a !== b && top[a]! >= 0 && (top[b]! < 0 || top[b]! > top[a]!)) out.push([a, b]);
  return out;
}

export function apply(p: readonly number[], pegs: number, [a, b]: [number, number]): Position {
  const d = tops(p, pegs)[a]!;
  const out = [...p];
  out[d] = b;
  return out;
}

const tables = new Map<string, Uint8Array>();
/** Distance to the goal (all disks on the last peg) for every position. */
export function distances(spec: HanoiSpec): Uint8Array {
  const key = `${spec.disks}/${spec.pegs}`;
  const cached = tables.get(key);
  if (cached) return cached;
  const size = spec.pegs ** spec.disks;
  const dist = new Uint8Array(size).fill(255);
  const goal = encode(new Array<number>(spec.disks).fill(spec.pegs - 1), spec.pegs);
  dist[goal] = 0;
  let frontier = [goal];
  for (let d = 1; frontier.length; d++) {
    const next: number[] = [];
    for (const k of frontier) {
      const p = decode(k, spec.disks, spec.pegs);
      for (const m of legalMoves(p, spec.pegs)) {
        const q = encode(apply(p, spec.pegs, m), spec.pegs);
        if (dist[q] === 255) {
          dist[q] = d;
          next.push(q);
        }
      }
    }
    frontier = next;
  }
  tables.set(key, dist);
  return dist;
}

export const minimum = (spec: HanoiSpec) =>
  distances(spec)[encode(new Array<number>(spec.disks).fill(0), spec.pegs)]!;

/** A move that brings the position one step closer to the goal. */
export function bestMove(spec: HanoiSpec, p: readonly number[]): [number, number] | null {
  const dist = distances(spec);
  const here = dist[encode(p, spec.pegs)]!;
  for (const m of legalMoves(p, spec.pegs))
    if (dist[encode(apply(p, spec.pegs, m), spec.pegs)] === here - 1) return m;
  return null;
}

export interface HanoiState {
  level: string;
  position: Position;
  history: Position[];
  moves: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export const specOf = (s: { level: string }) => SPECS[s.level] ?? SPECS.three!;

export function newHanoi(level: string): HanoiState {
  const lv = SPECS[level] ? level : 'three';
  return {
    level: lv,
    position: new Array<number>(SPECS[lv]!.disks).fill(0),
    history: [],
    moves: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

export const isGoal = (spec: HanoiSpec, p: readonly number[]) =>
  p.every((x) => x === spec.pegs - 1);

export function moveDisk(
  s: HanoiState,
  a: number,
  b: number,
  options: { hint?: boolean } = {},
): HanoiState {
  const spec = specOf(s);
  if (s.solved || !legalMoves(s.position, spec.pegs).some(([x, y]) => x === a && y === b)) return s;
  const position = apply(s.position, spec.pegs, [a, b]);
  return {
    ...s,
    position,
    history: [...s.history, s.position],
    moves: s.moves + 1,
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isGoal(spec, position),
  };
}

export function undo(s: HanoiState): HanoiState {
  const prev = s.history[s.history.length - 1];
  if (!prev || s.solved) return s;
  return { ...s, position: prev, history: s.history.slice(0, -1), moves: s.moves + 1 };
}

export function isValidHanoiState(d: unknown): d is HanoiState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as HanoiState;
  const spec = SPECS[s.level];
  if (!spec) return false;
  for (const k of ['moves', 'hints'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0 || typeof s.solved !== 'boolean')
    return false;
  const ok = (p: unknown) =>
    Array.isArray(p) &&
    p.length === spec.disks &&
    p.every((x) => Number.isInteger(x) && x >= 0 && x < spec.pegs);
  if (!ok(s.position) || !Array.isArray(s.history) || !s.history.every(ok)) return false;
  if (s.moves < s.history.length) return false;
  return s.solved === isGoal(spec, s.position);
}
