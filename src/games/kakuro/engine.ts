/**
 * Kakuro (#108): a crossword of numbers. White cells take 1–9; every horizontal or vertical run of
 * white cells adds up to the clue at its start and never repeats a digit. Puzzles are generated
 * from a seed: a symmetric layout of clue (black) cells, a random fill, and sums — kept when the
 * exact solver proves the solution unique and the technique solver can reach it (see `logic`).
 *
 * The grid is `rows × cols`; the top row and left column are always clue cells.
 */
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export interface Run {
  /** Cells of the run, in order. */
  cells: number[];
  sum: number;
  across: boolean;
  /** The clue cell the sum is written in. */
  clue: number;
}

export interface KakuroPuzzle {
  rows: number;
  cols: number;
  /** True for cells to fill. */
  white: boolean[];
  runs: Run[];
  solution: number[];
  /** Digits given at the start (0 elsewhere): a few, only when the sums alone allow two solutions. */
  given: number[];
}

export const bit = (d: number) => 1 << (d - 1);
export const ALL = (1 << 9) - 1;

export function digitsOf(m: number): number[] {
  const out: number[] = [];
  for (let d = 1; m; d++, m >>= 1) if (m & 1) out.push(d);
  return out;
}

const popcount = (m: number) => {
  let c = 0;
  while (m) {
    m &= m - 1;
    c++;
  }
  return c;
};

/** Digit sets (masks) by size and sum. */
const COMBOS = (() => {
  const table = new Map<string, number[]>();
  for (let m = 1; m <= ALL; m++) {
    const ds = digitsOf(m);
    const key = `${ds.length}:${ds.reduce((a, b) => a + b, 0)}`;
    table.set(key, [...(table.get(key) ?? []), m]);
  }
  return table;
})();
export const combos = (size: number, sum: number) => COMBOS.get(`${size}:${sum}`) ?? [];

/** Runs of a layout: maximal horizontal and vertical stretches of white cells (length ≥ 2). */
export function runsOf(rows: number, cols: number, white: readonly boolean[]): Omit<Run, 'sum'>[] {
  const out: Omit<Run, 'sum'>[] = [];
  for (const across of [true, false]) {
    const outer = across ? rows : cols;
    const inner = across ? cols : rows;
    for (let i = 0; i < outer; i++) {
      let start = -1;
      for (let j = 0; j <= inner; j++) {
        const c = across ? i * cols + j : j * cols + i;
        if (j < inner && white[c]) {
          if (start < 0) start = j;
          continue;
        }
        if (start >= 0 && j - start >= 2) {
          const cells = Array.from({ length: j - start }, (_, k) =>
            across ? i * cols + start + k : (start + k) * cols + i,
          );
          out.push({ cells, across, clue: across ? cells[0]! - 1 : cells[0]! - cols });
        }
        start = -1;
      }
    }
  }
  return out;
}

/** The runs through each white cell (one across, one down). */
export const runIndex = (cells: number, runs: readonly { cells: number[] }[]) => {
  const of = Array.from({ length: cells }, () => [] as number[]);
  runs.forEach((r, i) => r.cells.forEach((c) => of[c]!.push(i)));
  return of;
};

/**
 * Digits each empty cell of a run can still take, given the placed digits and candidate masks:
 * the union over the run's digit sets that contain the placed digits and can be spread over the
 * empty cells. Null on a contradiction.
 */
export function runAllowed(
  run: { cells: number[]; sum: number },
  value: (c: number) => number,
  mask: (c: number) => number,
): number | null {
  let placed = 0;
  const empty: number[] = [];
  for (const c of run.cells) {
    const v = value(c);
    if (v) {
      if (placed & bit(v)) return null;
      placed |= bit(v);
    } else empty.push(c);
  }
  let allowed = 0;
  for (const set of combos(run.cells.length, run.sum)) {
    if ((set & placed) !== placed) continue;
    const rest = set & ~placed;
    let union = 0;
    let ok = true;
    for (const c of empty) {
      const m = mask(c) & rest;
      if (!m) {
        ok = false;
        break;
      }
      union |= m;
    }
    if (ok && union === rest) allowed |= rest;
  }
  return empty.length && !allowed ? null : allowed;
}

export interface SolveResult {
  count: number;
  solutions: number[][];
  aborted: boolean;
}

/** Exact solver: run-combination propagation and naked singles, fewest-candidates search. */
export function solveKakuro(
  p: Pick<KakuroPuzzle, 'white' | 'runs'>,
  given: readonly number[],
  options: { limit?: number; maxNodes?: number } = {},
): SolveResult {
  const limit = options.limit ?? 2;
  const maxNodes = options.maxNodes ?? Infinity;
  const result: SolveResult = { count: 0, solutions: [], aborted: false };
  const whites = p.white.flatMap((w, c) => (w ? [c] : []));
  let nodes = 0;
  const propagate = (values: number[], masks: number[]): boolean => {
    for (let changed = true; changed;) {
      changed = false;
      for (const run of p.runs) {
        const allowed = runAllowed(
          run,
          (c) => values[c]!,
          (c) => masks[c]!,
        );
        if (allowed === null) return false;
        for (const c of run.cells) {
          if (values[c]) continue;
          const m = masks[c]! & allowed;
          if (!m) return false;
          if (m !== masks[c]) {
            masks[c] = m;
            changed = true;
          }
          if ((m & (m - 1)) === 0) {
            values[c] = digitsOf(m)[0]!;
            changed = true;
          }
        }
      }
    }
    return true;
  };
  const search = (values: number[], masks: number[]) => {
    if (++nodes > maxNodes) {
      result.aborted = true;
      return;
    }
    if (!propagate(values, masks)) return;
    let best = -1;
    for (const c of whites)
      if (!values[c] && (best < 0 || popcount(masks[c]!) < popcount(masks[best]!))) best = c;
    if (best < 0) {
      result.count++;
      result.solutions.push([...values]);
      return;
    }
    for (const d of digitsOf(masks[best]!)) {
      const v = [...values];
      const m = [...masks];
      v[best] = d;
      m[best] = bit(d);
      search(v, m);
      if (result.count >= limit || result.aborted) return;
    }
  };
  const masks = p.white.map((w, c) => (w ? (given[c] ? bit(given[c]!) : ALL) : 0));
  search([...given], masks);
  return result;
}

// ---------------------------------------------------------------- techniques (hints, grading)

export type Technique = 'run-combination' | 'single' | 'hidden-single' | 'guess';

export interface Step {
  technique: Technique;
  place?: { cell: number; digit: number };
  remove: { cell: number; digit: number }[];
  /** The run(s) the step relies on. */
  runs: number[];
}

/** Candidates of the empty cells: every digit, narrowed by the runs' placed digits. */
export function startMasks(p: KakuroPuzzle, values: readonly number[]): number[] {
  return p.white.map((w, c) => (w && !values[c] ? ALL : 0));
}

/**
 * The next logical step: a cell left with one candidate (single), a digit every combination of a
 * run needs that only one of its cells can take (hidden single), or candidates no combination of a
 * run allows (run combination).
 */
export function nextStep(p: KakuroPuzzle, values: readonly number[], masks: number[]): Step | null {
  const byCell = runIndex(p.white.length, p.runs);
  for (let c = 0; c < masks.length; c++) {
    const m = masks[c]!;
    if (!values[c] && m && (m & (m - 1)) === 0)
      return {
        technique: 'single',
        place: { cell: c, digit: digitsOf(m)[0]! },
        remove: [],
        runs: byCell[c]!,
      };
  }
  for (let i = 0; i < p.runs.length; i++) {
    const run = p.runs[i]!;
    const empty = run.cells.filter((c) => !values[c]);
    if (!empty.length) continue;
    // Digits in every remaining combination of the run.
    let placed = 0;
    for (const c of run.cells) if (values[c]) placed |= bit(values[c]!);
    let needed = ALL;
    let any = false;
    for (const set of combos(run.cells.length, run.sum)) {
      if ((set & placed) !== placed) continue;
      const rest = set & ~placed;
      if (empty.every((c) => masks[c]! & rest)) {
        needed &= rest;
        any = true;
      }
    }
    if (!any) continue;
    for (const d of digitsOf(needed)) {
      const spots = empty.filter((c) => masks[c]! & bit(d));
      if (spots.length === 1)
        return {
          technique: 'hidden-single',
          place: { cell: spots[0]!, digit: d },
          remove: [],
          runs: [i],
        };
    }
  }
  for (let i = 0; i < p.runs.length; i++) {
    const run = p.runs[i]!;
    const allowed = runAllowed(
      run,
      (c) => values[c]!,
      (c) => masks[c]!,
    );
    if (allowed === null) continue;
    const remove = run.cells.flatMap((c) =>
      values[c] ? [] : digitsOf(masks[c]! & ~allowed).map((digit) => ({ cell: c, digit })),
    );
    if (remove.length) return { technique: 'run-combination', remove, runs: [i] };
  }
  return null;
}

export function applyStep(values: number[], masks: number[], step: Step) {
  for (const { cell, digit } of step.remove) masks[cell]! &= ~bit(digit);
  if (step.place) {
    values[step.place.cell] = step.place.digit;
    masks[step.place.cell] = 0;
  }
}

/** Placed digits leave the candidates of the other cells of their runs. */
export function settle(p: KakuroPuzzle, values: readonly number[], masks: number[]) {
  for (const run of p.runs)
    for (const c of run.cells)
      if (values[c]) for (const x of run.cells) if (!values[x]) masks[x]! &= ~bit(values[c]!);
}

/** Steps up to the next placement from a position; null when the techniques are stuck. */
export function stepsToPlacement(p: KakuroPuzzle, values: readonly number[]): Step[] | null {
  const v = [...values];
  const masks = startMasks(p, v);
  settle(p, v, masks);
  const steps: Step[] = [];
  for (let i = 0; i < 500; i++) {
    const step = nextStep(p, v, masks);
    if (!step) return null;
    steps.push(step);
    if (step.place) return steps;
    applyStep(v, masks, step);
  }
  return null;
}

/** Whether the techniques alone solve the puzzle. */
export function logicSolves(p: KakuroPuzzle): boolean {
  const v = [...p.given];
  const masks = startMasks(p, v);
  settle(p, v, masks);
  for (let i = 0; i < 5000; i++) {
    if (p.white.every((w, c) => !w || v[c])) return true;
    const step = nextStep(p, v, masks);
    if (!step) return false;
    applyStep(v, masks, step);
    if (step.place) settle(p, v, masks);
  }
  return false;
}

// ---------------------------------------------------------------- generator

export interface KakuroSpec {
  rows: number;
  cols: number;
  /** Chance that an interior cell starts as a clue cell. */
  density: number;
  /** Longest run allowed. */
  maxRun: number;
  /** Most digits that may be given to make the solution unique. */
  maxGivens: number;
  /** Stop searching once a puzzle needs at most this many givens. */
  goodGivens: number;
  /** Local repair rounds per fill before falling back on givens. */
  repairs: number;
}

/** A symmetric layout where every white cell lies in an across and a down run of 2..maxRun. */
export function layout(spec: KakuroSpec, rng: Rng): boolean[] | null {
  const { rows, cols } = spec;
  const white = Array.from({ length: rows * cols }, (_, c) => c >= cols && c % cols !== 0);
  // Mirror through the centre of the playing area (rows 1.., cols 1..).
  const mirror = (c: number) => {
    const r = Math.floor(c / cols);
    const k = c % cols;
    return (rows - r) * cols + (cols - k);
  };
  for (let c = 0; c < white.length; c++) {
    if (!white[c] || rng.float() >= spec.density) continue;
    white[c] = false;
    const m = mirror(c);
    if (m >= 0 && m < white.length && m % cols !== 0 && m >= cols) white[m] = false;
  }
  const inside = (r: number, k: number) => r > 0 && k > 0 && r < rows && k < cols;
  const at = (r: number, k: number) => inside(r, k) && white[r * cols + k]!;
  // Repair: a cell alone on an axis gets a neighbour (or turns into a clue); long runs are cut.
  for (let pass = 0; pass < 60; pass++) {
    let changed = false;
    for (let c = 0; c < white.length; c++) {
      if (!white[c]) continue;
      const r = Math.floor(c / cols);
      const k = c % cols;
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ] as const) {
        if (at(r - dr, k - dc) || at(r + dr, k + dc)) continue;
        const open = [
          [r - dr, k - dc],
          [r + dr, k + dc],
        ].filter(([rr, kk]) => inside(rr!, kk!));
        if (open.length && rng.float() < 0.7) {
          const [rr, kk] = open[rng.int(open.length)]!;
          white[rr! * cols + kk!] = true;
        } else white[c] = false;
        changed = true;
        break;
      }
    }
    for (const run of runsOf(rows, cols, white))
      if (run.cells.length > spec.maxRun) {
        white[run.cells[2 + rng.int(run.cells.length - 4)]!] = false;
        changed = true;
      }
    if (!changed) break;
  }
  // Keep the largest connected group of white cells.
  const seen = new Set<number>();
  let best: number[] = [];
  for (let c = 0; c < white.length; c++) {
    if (!white[c] || seen.has(c)) continue;
    const group = [c];
    seen.add(c);
    for (let i = 0; i < group.length; i++) {
      const x = group[i]!;
      for (const y of [x - 1, x + 1, x - cols, x + cols])
        if (
          y >= 0 &&
          y < white.length &&
          white[y] &&
          !seen.has(y) &&
          Math.abs((y % cols) - (x % cols)) <= 1
        ) {
          seen.add(y);
          group.push(y);
        }
    }
    if (group.length > best.length) best = group;
  }
  const keep = new Set(best);
  for (let c = 0; c < white.length; c++) if (white[c] && !keep.has(c)) white[c] = false;
  // Everything must still sit in two runs.
  const runs = runsOf(rows, cols, white);
  const count = runIndex(white.length, runs);
  const ok = white.every((w, c) => !w || count[c]!.length === 2);
  return ok && best.length >= (rows - 1) * (cols - 1) * 0.45 ? white : null;
}

/** A random fill: distinct digits in every run. */
export function fill(
  white: readonly boolean[],
  runs: readonly { cells: number[] }[],
  rng: Rng,
): number[] | null {
  const byCell = runIndex(white.length, runs);
  const order = white.flatMap((w, c) => (w ? [c] : []));
  const values = white.map(() => 0);
  let steps = 0;
  const go = (i: number): boolean => {
    if (++steps > 20000) return false;
    if (i === order.length) return true;
    const c = order[i]!;
    let used = 0;
    for (const r of byCell[c]!)
      for (const x of runs[r]!.cells) if (values[x]) used |= bit(values[x]!);
    // Extreme digits first, more often: their sums have fewer combinations, so fewer solutions.
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((d) => ({ d, key: rng.float() * (1 + Math.abs(d - 5)) }))
      .sort((a, b) => b.key - a.key)
      .map((x) => x.d);
    for (const d of digits) {
      if (used & bit(d)) continue;
      values[c] = d;
      if (go(i + 1)) return true;
      values[c] = 0;
    }
    return false;
  };
  return go(0) ? values : null;
}

/**
 * Local repair towards a unique solution: while another solution exists, a cell where it differs
 * gets another digit (one its two runs do not use yet) and the sums are recomputed.
 */
export function repair(p: KakuroPuzzle, rng: Rng, rounds: number) {
  const byCell = runIndex(p.white.length, p.runs);
  const resum = () => {
    for (const run of p.runs) run.sum = run.cells.reduce((a, c) => a + p.solution[c]!, 0);
  };
  for (let i = 0; i < rounds; i++) {
    const r = solveKakuro(p, p.given.length ? p.given : p.white.map(() => 0), {
      limit: 2,
      maxNodes: 20000,
    });
    if (r.aborted) return;
    const other = r.solutions.find((x) => x.some((v, c) => v !== p.solution[c]));
    if (!other) return;
    const diff = rng.shuffle(
      p.white.flatMap((w, c) => (w && other[c] !== p.solution[c] ? [c] : [])),
    );
    for (const cell of diff) {
      let used = 0;
      for (const ri of byCell[cell]!)
        for (const x of p.runs[ri]!.cells) if (x !== cell) used |= bit(p.solution[x]!);
      const options = digitsOf(ALL & ~used & ~bit(p.solution[cell]!));
      if (!options.length) continue;
      p.solution[cell] = options[rng.int(options.length)]!;
      resum();
      break;
    }
  }
}

/**
 * Digits to give so that the solution is unique: while the solver finds another solution, the cell
 * where it first differs (in a random order) is given. Null when the solver gives up.
 */
export function givensFor(p: KakuroPuzzle, rng: Rng, maxGivens: number): number[] | null {
  const given = p.white.map(() => 0);
  const order = rng.shuffle(p.white.flatMap((w, c) => (w ? [c] : [])));
  for (let n = 0; n <= maxGivens; n++) {
    const r = solveKakuro(p, given, { limit: 2, maxNodes: 20000 });
    if (r.aborted) return null;
    const other = r.solutions.find((x) => x.some((v, c) => v !== p.solution[c]));
    if (!other) return given;
    const cell = order.find((c) => other[c] !== p.solution[c])!;
    given[cell] = p.solution[cell]!;
  }
  return null;
}

/** A puzzle with a unique solution that the techniques can solve, with as few givens as found. */
export function generateKakuro(spec: KakuroSpec, seed: number): KakuroPuzzle {
  const rng = new Rng(seed);
  let best: KakuroPuzzle | null = null;
  for (let attempt = 0; attempt < 400 && !(best && attempt > 40); attempt++) {
    const white = layout(spec, rng);
    if (!white) continue;
    const shapes = runsOf(spec.rows, spec.cols, white);
    for (let f = 0; f < 4; f++) {
      const solution = fill(white, shapes, rng);
      if (!solution) break;
      const runs = shapes.map((r) => ({
        ...r,
        sum: r.cells.reduce((a, c) => a + solution[c]!, 0),
      }));
      const p: KakuroPuzzle = {
        rows: spec.rows,
        cols: spec.cols,
        white,
        runs,
        solution,
        given: [],
      };
      repair(p, rng, spec.repairs);
      const given = givensFor(p, rng, spec.maxGivens);
      if (!given) continue;
      p.given = given;
      if (!logicSolves(p)) continue;
      const count = given.filter((x) => x).length;
      if (!best || count < best.given.filter((x) => x).length) best = p;
      if (count <= spec.goodGivens) return p;
    }
  }
  if (!best) throw new Error('No kakuro puzzle');
  return best;
}

// ---------------------------------------------------------------- play state

export const DIFFICULTIES: Record<string, KakuroSpec> = {
  easy: { rows: 7, cols: 7, density: 0.2, maxRun: 5, maxGivens: 8, goodGivens: 0, repairs: 30 },
  medium: { rows: 8, cols: 8, density: 0.2, maxRun: 6, maxGivens: 10, goodGivens: 1, repairs: 15 },
  hard: { rows: 9, cols: 9, density: 0.2, maxRun: 6, maxGivens: 10, goodGivens: 2, repairs: 10 },
};

interface Change {
  cells: number[];
  values: number[];
  notes: number[];
}

export interface KakuroState {
  difficulty: string;
  seed: number;
  puzzle: KakuroPuzzle;
  values: number[];
  notes: number[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newKakuro(difficulty: string, seed: number): KakuroState {
  const spec = DIFFICULTIES[difficulty];
  if (!spec) throw new Error(`Unknown difficulty ${difficulty}`);
  const puzzle = generateKakuro(spec, seed);
  return {
    difficulty,
    seed,
    puzzle,
    values: [...puzzle.given],
    notes: puzzle.given.map(() => 0),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

const UNDO_LIMIT = 500;

function change(
  s: KakuroState,
  cells: number[],
  edit: (values: number[], notes: number[]) => void,
): KakuroState {
  const values = [...s.values];
  const notes = [...s.notes];
  edit(values, notes);
  const touched = cells.filter((c) => values[c] !== s.values[c] || notes[c] !== s.notes[c]);
  if (!touched.length) return s;
  const record: Change = {
    cells: touched,
    values: touched.map((c) => s.values[c]!),
    notes: touched.map((c) => s.notes[c]!),
  };
  return { ...s, values, notes, undo: [...s.undo, record].slice(-UNDO_LIMIT), redo: [] };
}

const finish = (s: KakuroState): KakuroState => ({
  ...s,
  solved: s.puzzle.white.every((w, c) => !w || s.values[c] === s.puzzle.solution[c]),
});

const editable = (s: KakuroState, cell: number) =>
  !s.solved && !!s.puzzle.white[cell] && !s.puzzle.given[cell];

/** The other cells of the runs through a cell. */
export const runMates = (p: KakuroPuzzle, cell: number) =>
  [...new Set(p.runs.filter((r) => r.cells.includes(cell)).flatMap((r) => r.cells))].filter(
    (c) => c !== cell,
  );

/** Places a digit (or clears it when already there), removing it from the notes of its runs. */
export function placeDigit(
  s: KakuroState,
  cell: number,
  digit: number,
  options: { hint?: boolean } = {},
): KakuroState {
  if (!editable(s, cell) || digit < 1 || digit > 9) return s;
  const clearing = s.values[cell] === digit;
  const mates = clearing ? [] : runMates(s.puzzle, cell);
  const next = change(s, [cell, ...mates], (values, notes) => {
    values[cell] = clearing ? 0 : digit;
    notes[cell] = 0;
    for (const m of mates) notes[m]! &= ~bit(digit);
  });
  if (next === s) return s;
  const wrong = !clearing && digit !== s.puzzle.solution[cell];
  return finish({
    ...next,
    mistakes: s.mistakes + (wrong ? 1 : 0),
    hints: s.hints + (options.hint ? 1 : 0),
  });
}

export function toggleNote(s: KakuroState, cell: number, digit: number): KakuroState {
  if (!editable(s, cell) || s.values[cell]) return s;
  return change(s, [cell], (_values, notes) => {
    notes[cell]! ^= bit(digit);
  });
}

export function eraseCell(s: KakuroState, cell: number): KakuroState {
  if (!editable(s, cell)) return s;
  return change(s, [cell], (values, notes) => {
    values[cell] = 0;
    notes[cell] = 0;
  });
}

/** Fills every empty cell's notes with what its two runs' combinations still allow. */
export function fillNotes(s: KakuroState): KakuroState {
  if (s.solved) return s;
  const p = s.puzzle;
  const empty = p.white.flatMap((w, c) => (w && !s.values[c] ? [c] : []));
  const masks = startMasks(p, s.values);
  settle(p, s.values, masks);
  for (const run of p.runs) {
    const allowed =
      runAllowed(
        run,
        (c) => s.values[c]!,
        (c) => masks[c]!,
      ) ?? 0;
    for (const c of run.cells) if (!s.values[c]) masks[c]! &= allowed;
  }
  return change(s, empty, (_values, notes) => {
    for (const c of empty) notes[c] = masks[c]!;
  });
}

function swap(s: KakuroState, from: 'undo' | 'redo'): KakuroState {
  const last = s[from].at(-1);
  if (!last || s.solved) return s;
  const values = [...s.values];
  const notes = [...s.notes];
  const back: Change = {
    cells: last.cells,
    values: last.cells.map((c) => values[c]!),
    notes: last.cells.map((c) => notes[c]!),
  };
  last.cells.forEach((c, i) => {
    values[c] = last.values[i]!;
    notes[c] = last.notes[i]!;
  });
  const to = from === 'undo' ? 'redo' : 'undo';
  return finish({ ...s, values, notes, [from]: s[from].slice(0, -1), [to]: [...s[to], back] });
}

export const undoMove = (s: KakuroState) => swap(s, 'undo');
export const redoMove = (s: KakuroState) => swap(s, 'redo');

export const wrongCells = (s: KakuroState) =>
  s.values.flatMap((v, c) => (v && v !== s.puzzle.solution[c] ? [c] : []));

/** Runs that repeat a digit or whose digits already overshoot (or, when full, miss) the sum. */
export function badRuns(s: KakuroState): Set<number> {
  const out = new Set<number>();
  s.puzzle.runs.forEach((run, i) => {
    const digits = run.cells.map((c) => s.values[c]!).filter((v) => v);
    const sum = digits.reduce((a, b) => a + b, 0);
    if (
      new Set(digits).size < digits.length ||
      sum > run.sum ||
      (digits.length === run.cells.length && sum !== run.sum)
    )
      out.add(i);
  });
  return out;
}

const intArray = (a: unknown, n: number, max: number) =>
  Array.isArray(a) &&
  a.length === n &&
  a.every((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= max);

/** A saved game is valid when its puzzle is exactly the one its seed generates. */
export function isValidKakuroState(data: unknown): data is KakuroState {
  if (!isRecord(data)) return false;
  const d = data as unknown as KakuroState;
  if (typeof d.difficulty !== 'string' || !(d.difficulty in DIFFICULTIES)) return false;
  if (!Number.isInteger(d.seed) || !Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || !Number.isInteger(d.hints) || typeof d.solved !== 'boolean')
    return false;
  if (!Array.isArray(d.undo) || !Array.isArray(d.redo) || !isRecord(d.puzzle)) return false;
  const p = d.puzzle;
  const n = p.white?.length;
  if (!intArray(d.values, n, 9) || !intArray(d.notes, n, ALL)) return false;
  const fresh = newKakuro(d.difficulty, d.seed).puzzle;
  if (JSON.stringify(fresh) !== JSON.stringify(p)) return false;
  if (p.given.some((g, c) => g && d.values[c] !== g)) return false;
  if (d.values.some((v, c) => v && !p.white[c])) return false;
  const ok = (list: unknown[]) =>
    list.every(
      (ch) =>
        isRecord(ch) &&
        Array.isArray(ch.cells) &&
        ch.cells.every((c) => Number.isInteger(c) && (c as number) >= 0 && (c as number) < n) &&
        intArray(ch.values, ch.cells.length, 9) &&
        intArray(ch.notes, ch.cells.length, ALL),
    );
  return (
    ok(d.undo) &&
    ok(d.redo) &&
    d.solved === p.white.every((w, c) => !w || d.values[c] === p.solution[c])
  );
}
