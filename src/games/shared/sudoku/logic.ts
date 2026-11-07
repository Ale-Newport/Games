/**
 * Human solving techniques, for hints and for grading generated puzzles. Each step works on the
 * candidates of the empty cells and either places a digit or removes candidates.
 *
 * Levels: 1 singles; 2 locked candidates, naked and hidden pairs; 3 triples, X-Wing, Y-Wing and
 * Swordfish. A puzzle that needs none of these to get unstuck needs trial and error (level 4).
 */
import { bit, candidates, digitsOf, popcount, type Geometry } from './grid';

export type Technique =
  | 'naked-single'
  | 'hidden-single'
  | 'pointing'
  | 'claiming'
  | 'naked-pair'
  | 'hidden-pair'
  | 'naked-triple'
  | 'hidden-triple'
  | 'x-wing'
  | 'y-wing'
  | 'swordfish'
  | 'cage-combination'
  | 'innie'
  | 'outie'
  | 'cage-arithmetic';

export const TECHNIQUE_LEVEL: Record<Technique, number> = {
  'naked-single': 1,
  'hidden-single': 1,
  pointing: 2,
  claiming: 2,
  'naked-pair': 2,
  'hidden-pair': 2,
  'naked-triple': 3,
  'hidden-triple': 3,
  'x-wing': 3,
  'y-wing': 3,
  swordfish: 3,
  'cage-combination': 1,
  innie: 2,
  outie: 2,
  'cage-arithmetic': 1,
};

export interface Elimination {
  cell: number;
  digit: number;
}

export interface Step {
  technique: Technique;
  /** The digit placed (singles). */
  place?: { cell: number; digit: number };
  /** Candidates removed. */
  remove: Elimination[];
  /** The cells forming the pattern. */
  cells: number[];
  /** The digits involved. */
  digits: number[];
  /** The unit the pattern lives in (index into `geo.units`), when there is one. */
  unit?: number;
  /** A cage sum the step relies on (killer techniques). */
  sum?: number;
}

/** A variant's own technique, tried after the built-in ones of the same level. */
export interface StepExtra {
  level: number;
  find: (geo: Geometry, st: LogicState) => Step | null;
}

/** Placed digits and candidate masks (0 for filled cells). */
export interface LogicState {
  values: number[];
  cands: number[];
}

export function logicState(geo: Geometry, grid: readonly number[]): LogicState {
  return { values: [...grid], cands: candidates(geo, grid) };
}

function combinations<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i <= items.length - (k - acc.length); i++) {
      acc.push(items[i]!);
      pick(i + 1, acc);
      acc.pop();
    }
  };
  pick(0, []);
  return out;
}

const emptyIn = (st: LogicState, unit: readonly number[]) => unit.filter((c) => !st.values[c]);
const where = (st: LogicState, unit: readonly number[], d: number) =>
  unit.filter((c) => !st.values[c] && st.cands[c]! & bit(d));

function nakedSingle(geo: Geometry, st: LogicState): Step | null {
  for (let c = 0; c < geo.cells; c++) {
    const m = st.cands[c]!;
    if (!st.values[c] && m && (m & (m - 1)) === 0) {
      const digit = digitsOf(m)[0]!;
      return {
        technique: 'naked-single',
        place: { cell: c, digit },
        remove: [],
        cells: [c],
        digits: [digit],
      };
    }
  }
  return null;
}

function hiddenSingle(geo: Geometry, st: LogicState): Step | null {
  // Boxes first: that is where people look first.
  const order = geo.units.map((_, i) => i).sort((a, b) => kindRank(geo, a) - kindRank(geo, b));
  for (const u of order) {
    const unit = geo.units[u]!;
    for (let d = 1; d <= geo.size; d++) {
      const spots = where(st, unit, d);
      if (spots.length === 1 && !unit.some((c) => st.values[c] === d))
        return {
          technique: 'hidden-single',
          place: { cell: spots[0]!, digit: d },
          remove: [],
          cells: [spots[0]!],
          digits: [d],
          unit: u,
        };
    }
  }
  return null;
}

const kindRank = (geo: Geometry, u: number) =>
  ({ box: 0, row: 1, col: 2, diag: 3 })[geo.unitKinds[u]!];

/** Locked candidates: a digit confined to the intersection of two units leaves the rest of both. */
function lockedCandidates(geo: Geometry, st: LogicState): Step | null {
  for (let u = 0; u < geo.units.length; u++) {
    const unit = geo.units[u]!;
    for (let d = 1; d <= geo.size; d++) {
      const spots = where(st, unit, d);
      if (spots.length < 2) continue;
      for (const v of geo.unitsOf[spots[0]!]!) {
        if (v === u || !spots.every((c) => geo.unitsOf[c]!.includes(v))) continue;
        const remove = where(st, geo.units[v]!, d)
          .filter((c) => !spots.includes(c))
          .map((cell) => ({ cell, digit: d }));
        if (remove.length)
          return {
            technique: geo.unitKinds[u] === 'box' ? 'pointing' : 'claiming',
            remove,
            cells: spots,
            digits: [d],
            unit: u,
          };
      }
    }
  }
  return null;
}

function nakedSubset(geo: Geometry, st: LogicState, k: number): Step | null {
  for (let u = 0; u < geo.units.length; u++) {
    const empty = emptyIn(st, geo.units[u]!);
    if (empty.length <= k) continue;
    const small = empty.filter((c) => popcount(st.cands[c]!) <= k);
    for (const set of combinations(small, k)) {
      const mask = set.reduce((m, c) => m | st.cands[c]!, 0);
      if (popcount(mask) !== k) continue;
      const remove: Elimination[] = [];
      for (const c of empty)
        if (!set.includes(c))
          for (const d of digitsOf(st.cands[c]! & mask)) remove.push({ cell: c, digit: d });
      if (remove.length)
        return {
          technique: k === 2 ? 'naked-pair' : 'naked-triple',
          remove,
          cells: set,
          digits: digitsOf(mask),
          unit: u,
        };
    }
  }
  return null;
}

function hiddenSubset(geo: Geometry, st: LogicState, k: number): Step | null {
  for (let u = 0; u < geo.units.length; u++) {
    const unit = geo.units[u]!;
    const empty = emptyIn(st, unit);
    if (empty.length <= k) continue;
    const digits: number[] = [];
    for (let d = 1; d <= geo.size; d++) {
      const n = where(st, unit, d).length;
      if (n >= 1 && n <= k) digits.push(d);
    }
    for (const set of combinations(digits, k)) {
      const cells = [...new Set(set.flatMap((d) => where(st, unit, d)))];
      if (cells.length !== k) continue;
      const keep = set.reduce((m, d) => m | bit(d), 0);
      const remove: Elimination[] = [];
      for (const c of cells)
        for (const d of digitsOf(st.cands[c]! & ~keep)) remove.push({ cell: c, digit: d });
      if (remove.length)
        return {
          technique: k === 2 ? 'hidden-pair' : 'hidden-triple',
          remove,
          cells,
          digits: set,
          unit: u,
        };
    }
  }
  return null;
}

/** X-Wing (k = 2) and Swordfish (k = 3) on rows and columns. */
function fish(geo: Geometry, st: LogicState, k: number): Step | null {
  const n = geo.size;
  for (let d = 1; d <= n; d++) {
    for (const byRow of [true, false]) {
      const lines: { line: number; spots: number[] }[] = [];
      for (let i = 0; i < n; i++) {
        const unit = geo.units[byRow ? i : n + i]!;
        const spots = where(st, unit, d).map((c) => (byRow ? c % n : Math.floor(c / n)));
        if (spots.length >= 2 && spots.length <= k) lines.push({ line: i, spots });
      }
      for (const set of combinations(lines, k)) {
        const cross = [...new Set(set.flatMap((x) => x.spots))];
        if (cross.length !== k) continue;
        const chosen = set.map((x) => x.line);
        const remove: Elimination[] = [];
        for (const x of cross) {
          const unit = geo.units[byRow ? n + x : x]!;
          for (const c of where(st, unit, d)) {
            const line = byRow ? Math.floor(c / n) : c % n;
            if (!chosen.includes(line)) remove.push({ cell: c, digit: d });
          }
        }
        if (remove.length) {
          const cells = set.flatMap((x) =>
            x.spots.map((y) => (byRow ? x.line * n + y : y * n + x.line)),
          );
          return { technique: k === 2 ? 'x-wing' : 'swordfish', remove, cells, digits: [d] };
        }
      }
    }
  }
  return null;
}

function yWing(geo: Geometry, st: LogicState): Step | null {
  const pairs = st.cands.flatMap((m, c) => (!st.values[c] && popcount(m) === 2 ? [c] : []));
  for (const pivot of pairs) {
    const [a, b] = digitsOf(st.cands[pivot]!) as [number, number];
    const wings = geo.peers[pivot]!.filter((c) => pairs.includes(c));
    for (const x of wings) {
      const mx = st.cands[x]!;
      if (!(mx & bit(a)) || mx & bit(b)) continue;
      const c3 = digitsOf(mx & ~bit(a))[0]!;
      for (const y of wings) {
        if (y === x || st.cands[y] !== (bit(b) | bit(c3))) continue;
        const remove = geo.peers[x]!.filter(
          (c) => c !== y && c !== pivot && geo.peers[y]!.includes(c),
        )
          .filter((c) => !st.values[c] && st.cands[c]! & bit(c3))
          .map((cell) => ({ cell, digit: c3 }));
        if (remove.length)
          return { technique: 'y-wing', remove, cells: [pivot, x, y], digits: [a, b, c3] };
      }
    }
  }
  return null;
}

/** The easiest step that makes progress, or null when none of the techniques apply. */
export function nextStep(
  geo: Geometry,
  st: LogicState,
  extras: readonly StepExtra[] = [],
): Step | null {
  const extra = (level: number) => {
    for (const x of extras)
      if (x.level === level) {
        const step = x.find(geo, st);
        if (step) return step;
      }
    return null;
  };
  return (
    nakedSingle(geo, st) ??
    hiddenSingle(geo, st) ??
    extra(1) ??
    lockedCandidates(geo, st) ??
    nakedSubset(geo, st, 2) ??
    hiddenSubset(geo, st, 2) ??
    extra(2) ??
    nakedSubset(geo, st, 3) ??
    hiddenSubset(geo, st, 3) ??
    fish(geo, st, 2) ??
    yWing(geo, st) ??
    fish(geo, st, 3) ??
    extra(3)
  );
}

export function applyStep(geo: Geometry, st: LogicState, step: Step): void {
  for (const { cell, digit } of step.remove) st.cands[cell]! &= ~bit(digit);
  if (step.place) {
    const { cell, digit } = step.place;
    st.values[cell] = digit;
    st.cands[cell] = 0;
    for (const p of geo.peers[cell]!) st.cands[p]! &= ~bit(digit);
  }
}

export interface Grade {
  solved: boolean;
  /** The hardest technique level needed (4 when the techniques get stuck). */
  level: number;
  steps: number;
  used: Partial<Record<Technique, number>>;
}

/** Solves with the techniques alone, easiest first, and reports the hardest one needed. */
export function gradePuzzle(
  geo: Geometry,
  grid: readonly number[],
  extras: readonly StepExtra[] = [],
  maxSteps = 2000,
): Grade {
  const st = logicState(geo, grid);
  const grade: Grade = { solved: false, level: 1, steps: 0, used: {} };
  for (; grade.steps < maxSteps; grade.steps++) {
    if (st.values.every((v) => v)) {
      grade.solved = true;
      return grade;
    }
    const step = nextStep(geo, st, extras);
    if (!step) break;
    grade.level = Math.max(grade.level, TECHNIQUE_LEVEL[step.technique]);
    grade.used[step.technique] = (grade.used[step.technique] ?? 0) + 1;
    applyStep(geo, st, step);
  }
  grade.level = 4;
  return grade;
}

/**
 * The steps from a position up to (and including) the next placement: the eliminations a person
 * would need first, then the digit. Null when the techniques get stuck.
 */
export function stepsToPlacement(
  geo: Geometry,
  grid: readonly number[],
  extras: readonly StepExtra[] = [],
): Step[] | null {
  const st = logicState(geo, grid);
  const steps: Step[] = [];
  for (let i = 0; i < 400; i++) {
    const step = nextStep(geo, st, extras);
    if (!step) return null;
    steps.push(step);
    if (step.place) return steps;
    applyStep(geo, st, step);
  }
  return null;
}
