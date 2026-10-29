/**
 * Lights Out rules and solver. Pressing a light toggles it and its neighbours (the four beside it,
 * or, in the diagonal variant, the four corners); switch every light off. Puzzles are random
 * presses from the dark board, so every one is solvable. The solver works over GF(2): Gaussian
 * elimination gives one solution, and trying every combination of the null space gives the fewest
 * presses.
 */
import { Rng } from '../../core/game-engine/random';

export type Pattern = 'plus' | 'cross';

export interface LightsSpec {
  size: number;
  pattern: Pattern;
  /** Random presses used to scramble. */
  presses: number;
}

export const SPECS: Record<string, LightsSpec> = {
  easy: { size: 4, pattern: 'plus', presses: 4 },
  classic: { size: 5, pattern: 'plus', presses: 9 },
  large: { size: 7, pattern: 'plus', presses: 16 },
  diagonal: { size: 5, pattern: 'cross', presses: 9 },
};

/** Cells a press on `c` toggles. */
export function toggled(size: number, pattern: Pattern, c: number): number[] {
  const r = Math.floor(c / size);
  const k = c % size;
  const deltas =
    pattern === 'plus'
      ? [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
      : [
          [0, 0],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ];
  return deltas
    .map(([dr, dk]) => [r + dr!, k + dk!] as const)
    .filter(([rr, kk]) => rr >= 0 && rr < size && kk >= 0 && kk < size)
    .map(([rr, kk]) => rr * size + kk);
}

export function press(lights: readonly boolean[], size: number, pattern: Pattern, c: number) {
  const out = [...lights];
  for (const x of toggled(size, pattern, c)) out[x] = !out[x];
  return out;
}

/**
 * The fewest presses that switch every light off (each cell pressed at most once), or null when
 * the board cannot be solved.
 */
export function solveLights(
  lights: readonly boolean[],
  size: number,
  pattern: Pattern,
): number[] | null {
  const n = size * size;
  // Augmented matrix rows as bigints: bit j (j < n) = press j toggles cell i; bit n = light i.
  const rows: bigint[] = [];
  for (let i = 0; i < n; i++) {
    let row = lights[i] ? 1n << BigInt(n) : 0n;
    for (let j = 0; j < n; j++) if (toggled(size, pattern, j).includes(i)) row |= 1n << BigInt(j);
    rows.push(row);
  }
  const pivotOf: number[] = [];
  let rank = 0;
  for (let col = 0; col < n && rank < n; col++) {
    const bit = 1n << BigInt(col);
    let p = rank;
    while (p < n && !(rows[p]! & bit)) p++;
    if (p === n) continue;
    [rows[rank], rows[p]] = [rows[p]!, rows[rank]!];
    for (let i = 0; i < n; i++) if (i !== rank && rows[i]! & bit) rows[i] = rows[i]! ^ rows[rank]!;
    pivotOf[rank] = col;
    rank++;
  }
  const rhs = 1n << BigInt(n);
  for (let i = rank; i < n; i++) if (rows[i]! & rhs) return null;
  const pivots = new Set(pivotOf);
  const free = Array.from({ length: n }, (_, j) => j).filter((j) => !pivots.has(j));
  let best: number[] | null = null;
  // The null space is small (dimension 0–2 for 4×4…7×7 plus boards); try every choice.
  for (let mask = 0; mask < 1 << free.length; mask++) {
    const x = new Array<boolean>(n).fill(false);
    free.forEach((j, b) => (x[j] = ((mask >> b) & 1) === 1));
    for (let i = rank - 1; i >= 0; i--) {
      const col = pivotOf[i]!;
      let v = (rows[i]! & rhs) !== 0n;
      for (const j of free) if (x[j] && rows[i]! & (1n << BigInt(j))) v = !v;
      x[col] = v;
    }
    const presses = x.flatMap((on, j) => (on ? [j] : []));
    if (!best || presses.length < best.length) best = presses;
  }
  return best;
}

export interface LightsState {
  level: string;
  seed: number;
  lights: boolean[];
  start: boolean[];
  presses: number[];
  hints: number;
  elapsedMs: number;
  solved: boolean;
  /** Fewest presses from the start. */
  optimal: number;
}

export const specOf = (s: { level: string }) => SPECS[s.level] ?? SPECS.classic!;

export function scrambleLights(spec: LightsSpec, seed: number): boolean[] {
  const rng = new Rng(seed >>> 0);
  const n = spec.size * spec.size;
  for (;;) {
    let lights = new Array<boolean>(n).fill(false);
    const cells = new Set<number>();
    while (cells.size < spec.presses) cells.add(rng.int(n));
    for (const c of cells) lights = press(lights, spec.size, spec.pattern, c);
    if (lights.some(Boolean)) return lights;
  }
}

export function newLights(level: string, seed: number): LightsState {
  const lv = SPECS[level] ? level : 'classic';
  const spec = SPECS[lv]!;
  const start = scrambleLights(spec, seed);
  return {
    level: lv,
    seed: seed >>> 0,
    lights: [...start],
    start,
    presses: [],
    hints: 0,
    elapsedMs: 0,
    solved: false,
    optimal: solveLights(start, spec.size, spec.pattern)!.length,
  };
}

export function pressCell(
  s: LightsState,
  c: number,
  options: { hint?: boolean } = {},
): LightsState {
  const spec = specOf(s);
  if (s.solved || !Number.isInteger(c) || c < 0 || c >= spec.size * spec.size) return s;
  const lights = press(s.lights, spec.size, spec.pattern, c);
  return {
    ...s,
    lights,
    presses: [...s.presses, c],
    hints: s.hints + (options.hint ? 1 : 0),
    solved: lights.every((x) => !x),
  };
}

export function undoPress(s: LightsState): LightsState {
  const last = s.presses[s.presses.length - 1];
  if (last === undefined || s.solved) return s;
  const spec = specOf(s);
  return {
    ...s,
    lights: press(s.lights, spec.size, spec.pattern, last),
    presses: s.presses.slice(0, -1),
  };
}

export function isValidLightsState(d: unknown): d is LightsState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as LightsState;
  const spec = SPECS[s.level];
  if (!spec || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  if (!Number.isInteger(s.hints) || s.hints < 0 || !Number.isFinite(s.elapsedMs) || s.elapsedMs < 0)
    return false;
  const start = scrambleLights(spec, s.seed);
  if (!Array.isArray(s.start) || s.start.join() !== start.join()) return false;
  if (s.optimal !== solveLights(start, spec.size, spec.pattern)!.length) return false;
  if (!Array.isArray(s.presses)) return false;
  let lights = start;
  for (const c of s.presses) {
    if (!Number.isInteger(c) || c < 0 || c >= spec.size * spec.size) return false;
    lights = press(lights, spec.size, spec.pattern, c);
  }
  return (
    Array.isArray(s.lights) &&
    lights.join() === s.lights.join() &&
    s.solved === lights.every((x) => !x)
  );
}
