/** Tube-sorting game state: levels, moves with undo, hints, and save validation by replay. */
import {
  isSorted,
  moves,
  pour,
  shuffleTubes,
  solveSort,
  type SortRules,
  type SortSpec,
  type Tube,
} from './engine';

export interface SortState {
  level: string;
  seed: number;
  start: Tube[];
  tubes: Tube[];
  /** Moves made, as [from, to], for undo and validation. */
  history: [number, number][];
  undos: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

/** The first shuffle from `seed` on that the solver can finish (they almost always are). */
export function startTubes(spec: SortSpec, rules: SortRules, seed: number): Tube[] {
  for (let k = 0; k < 50; k++) {
    const t = shuffleTubes(spec, (seed + k * 7919) >>> 0);
    if (solveSort(t, rules).moves) return t;
  }
  return shuffleTubes(spec, seed);
}

export function newSort(
  specs: Record<string, SortSpec>,
  rules: (spec: SortSpec) => SortRules,
  level: string,
  seed: number,
): SortState {
  const lv = specs[level] ? level : Object.keys(specs)[0]!;
  const spec = specs[lv]!;
  const start = startTubes(spec, rules(spec), seed);
  return {
    level: lv,
    seed: seed >>> 0,
    start,
    tubes: start.map((t) => [...t]),
    history: [],
    undos: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

export function move(
  s: SortState,
  rules: SortRules,
  a: number,
  b: number,
  options: { hint?: boolean } = {},
): SortState {
  if (s.solved || !moves(s.tubes, rules).some(([x, y]) => x === a && y === b)) return s;
  const tubes = pour(s.tubes, a, b, rules);
  return {
    ...s,
    tubes,
    history: [...s.history, [a, b]],
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSorted(tubes, rules),
  };
}

export function undo(s: SortState, rules: SortRules): SortState {
  if (s.solved || !s.history.length) return s;
  let tubes = s.start.map((t) => [...t]);
  const history = s.history.slice(0, -1);
  for (const [a, b] of history) tubes = pour(tubes, a, b, rules);
  return { ...s, tubes, history, undos: s.undos + 1 };
}

export function isValidSortState(
  d: unknown,
  specs: Record<string, SortSpec>,
  rules: (spec: SortSpec) => SortRules,
): d is SortState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as SortState;
  const spec = specs[s.level];
  if (!spec || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff) return false;
  for (const k of ['undos', 'hints'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0 || typeof s.solved !== 'boolean')
    return false;
  const r = rules(spec);
  const start = startTubes(spec, r, s.seed);
  if (JSON.stringify(start) !== JSON.stringify(s.start) || !Array.isArray(s.history)) return false;
  let tubes = start;
  for (const m of s.history) {
    if (!Array.isArray(m) || m.length !== 2) return false;
    const [a, b] = m as [number, number];
    if (!moves(tubes, r).some(([x, y]) => x === a && y === b)) return false;
    tubes = pour(tubes, a, b, r);
  }
  return JSON.stringify(tubes) === JSON.stringify(s.tubes) && s.solved === isSorted(tubes, r);
}
