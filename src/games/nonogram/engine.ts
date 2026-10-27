/**
 * Nonogram (#112): fill cells of a grid so that every row and column shows the runs of filled
 * cells its clue lists, in order (a clue "3 1" means a run of three, a gap, then a run of one).
 *
 * Every puzzle here can be solved line by line — the line solver alone fills it completely — which
 * also proves its solution unique. Puzzles are either generated from a seed (a random blobby
 * picture, repaired by flipping undecided cells until the line solver finishes) or one of the
 * original hand-drawn pictures in `pictures.ts`.
 */
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';
import { PICTURES } from './pictures';

export const UNKNOWN = 0;
export const FILLED = 1;
export const EMPTY = 2;
/** 0 unknown, 1 filled, 2 empty (crossed). */
export type Cell = 0 | 1 | 2;

export interface NonoPuzzle {
  rows: number;
  cols: number;
  solution: boolean[];
  rowClues: number[][];
  colClues: number[][];
  /** The picture's id, for drawn puzzles. */
  picture?: string;
}

export const runsOf = (line: readonly boolean[]) => {
  const out: number[] = [];
  let run = 0;
  for (const x of line) {
    if (x) run++;
    else if (run) {
      out.push(run);
      run = 0;
    }
  }
  if (run) out.push(run);
  return out;
};

export const rowOf = <T>(grid: readonly T[], cols: number, r: number) =>
  grid.slice(r * cols, r * cols + cols);
export const colOf = <T>(grid: readonly T[], rows: number, cols: number, c: number) =>
  Array.from({ length: rows }, (_, r) => grid[r * cols + c]!);

export function makePuzzle(
  rows: number,
  cols: number,
  solution: boolean[],
  picture?: string,
): NonoPuzzle {
  return {
    rows,
    cols,
    solution,
    rowClues: Array.from({ length: rows }, (_, r) => runsOf(rowOf(solution, cols, r))),
    colClues: Array.from({ length: cols }, (_, c) => runsOf(colOf(solution, rows, cols, c))),
    ...(picture ? { picture } : {}),
  };
}

/**
 * Line solver: every cell that is filled (or empty) in all placements of the clue's runs
 * consistent with the known cells. Null when no placement fits.
 */
export function solveLine(clue: readonly number[], cells: readonly Cell[]): Cell[] | null {
  const L = cells.length;
  const k = clue.length;
  const canFill = Array<boolean>(L).fill(false);
  const canEmpty = Array<boolean>(L).fill(false);
  const memo = new Map<number, boolean>();
  // fits(b, p): runs b.. can be placed in cells p.. (cell p free to start a run or a gap).
  const fits = (b: number, p: number): boolean => {
    const key = b * (L + 2) + p;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let ok = false;
    if (b === k) {
      ok = true;
      for (let i = p; i < L; i++) if (cells[i] === FILLED) ok = false;
    } else {
      const len = clue[b]!;
      for (let s = p; s + len <= L; s++) {
        if (s > p && cells[s - 1] === FILLED) break;
        let blockOk = true;
        for (let i = s; i < s + len; i++) if (cells[i] === EMPTY) blockOk = false;
        if (!blockOk) continue;
        if (s + len < L && cells[s + len] === FILLED) continue;
        if (fits(b + 1, Math.min(L, s + len + 1))) {
          ok = true;
          break;
        }
      }
    }
    memo.set(key, ok);
    return ok;
  };
  if (!fits(0, 0)) return null;
  const seen = new Set<number>();
  const mark = (b: number, p: number) => {
    const key = b * (L + 2) + p;
    if (seen.has(key)) return;
    seen.add(key);
    if (b === k) {
      for (let i = p; i < L; i++) canEmpty[i] = true;
      return;
    }
    const len = clue[b]!;
    for (let s = p; s + len <= L; s++) {
      if (s > p && cells[s - 1] === FILLED) break;
      let blockOk = true;
      for (let i = s; i < s + len; i++) if (cells[i] === EMPTY) blockOk = false;
      if (!blockOk) continue;
      if (s + len < L && cells[s + len] === FILLED) continue;
      const next = Math.min(L, s + len + 1);
      if (!fits(b + 1, next)) continue;
      for (let i = p; i < s; i++) canEmpty[i] = true;
      for (let i = s; i < s + len; i++) canFill[i] = true;
      if (s + len < L) canEmpty[s + len] = true;
      mark(b + 1, next);
    }
  };
  mark(0, 0);
  return cells.map((c, i) =>
    c ? c : canFill[i] && !canEmpty[i] ? FILLED : !canFill[i] && canEmpty[i] ? EMPTY : UNKNOWN,
  );
}

export interface LineStep {
  row: boolean;
  index: number;
  /** Cells (grid indexes) decided by this line, with their value. */
  set: { cell: number; value: 1 | 2 }[];
}

/** The next line that decides something (rows first, then columns), or null. */
export function nextLineStep(p: NonoPuzzle, grid: readonly Cell[]): LineStep | null {
  for (const row of [true, false]) {
    const count = row ? p.rows : p.cols;
    for (let i = 0; i < count; i++) {
      const idx = row
        ? Array.from({ length: p.cols }, (_, c) => i * p.cols + c)
        : Array.from({ length: p.rows }, (_, r) => r * p.cols + i);
      const cells = idx.map((x) => grid[x]!);
      const solved = solveLine(row ? p.rowClues[i]! : p.colClues[i]!, cells);
      if (!solved) continue;
      const set = idx.flatMap((x, j) =>
        !cells[j] && solved[j] ? [{ cell: x, value: solved[j] as 1 | 2 }] : [],
      );
      if (set.length) return { row, index: i, set };
    }
  }
  return null;
}

/** Line-solves as far as possible; returns the grid and the number of line passes. */
export function lineSolve(p: NonoPuzzle, start?: readonly Cell[]): { grid: Cell[]; steps: number } {
  const grid: Cell[] = start ? [...start] : p.solution.map(() => UNKNOWN);
  let steps = 0;
  for (let step = nextLineStep(p, grid); step; step = nextLineStep(p, grid)) {
    for (const { cell, value } of step.set) grid[cell] = value;
    steps++;
  }
  return { grid, steps };
}

export const lineSolvable = (p: NonoPuzzle) => lineSolve(p).grid.every((c) => c !== UNKNOWN);

/** Line propagation to a fixed point; null on a contradiction. */
function propagate(p: NonoPuzzle, grid: Cell[]): Cell[] | null {
  for (let changed = true; changed;) {
    changed = false;
    for (const row of [true, false]) {
      const count = row ? p.rows : p.cols;
      for (let i = 0; i < count; i++) {
        const idx = row
          ? Array.from({ length: p.cols }, (_, c) => i * p.cols + c)
          : Array.from({ length: p.rows }, (_, r) => r * p.cols + i);
        const solved = solveLine(
          row ? p.rowClues[i]! : p.colClues[i]!,
          idx.map((x) => grid[x]!),
        );
        if (!solved) return null;
        idx.forEach((x, j) => {
          if (grid[x] !== solved[j]) {
            grid[x] = solved[j]!;
            changed = true;
          }
        });
      }
    }
  }
  return grid;
}

/** Exact solver: line propagation plus search; counts solutions up to `limit`. */
export function solveExact(
  p: NonoPuzzle,
  start?: readonly Cell[],
  limit = 2,
): { count: number; first: boolean[] | null } {
  const result = { count: 0, first: null as boolean[] | null };
  const search = (grid: Cell[]) => {
    const g = propagate(p, grid);
    if (!g) return;
    const open = g.indexOf(UNKNOWN);
    if (open < 0) {
      result.count++;
      result.first ??= g.map((c) => c === FILLED);
      return;
    }
    for (const v of [FILLED, EMPTY] as const) {
      const next = [...g];
      next[open] = v;
      search(next);
      if (result.count >= limit) return;
    }
  };
  search(start ? [...start] : p.solution.map(() => UNKNOWN));
  return result;
}

// ---------------------------------------------------------------- generator

export interface NonoSpec {
  rows: number;
  cols: number;
  density: number;
}

/** A blobby random picture: noise smoothed by a majority rule. */
function randomPicture(spec: NonoSpec, rng: Rng): boolean[] {
  const { rows, cols } = spec;
  let g = Array.from({ length: rows * cols }, () => rng.float() < spec.density);
  for (let pass = 0; pass < 2; pass++) {
    g = g.map((v, c) => {
      const r = Math.floor(c / cols);
      const k = c % cols;
      let on = 0;
      let all = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dk = -1; dk <= 1; dk++) {
          const rr = r + dr;
          const kk = k + dk;
          if (rr < 0 || kk < 0 || rr >= rows || kk >= cols) continue;
          all++;
          if (g[rr * cols + kk]) on++;
        }
      return on * 2 > all ? true : on * 2 < all ? false : v;
    });
  }
  return g;
}

/**
 * A random puzzle the line solver finishes: while some cells stay undecided, one of them is
 * flipped in the picture (changing the clues) and the solver runs again.
 */
export function generateNonogram(spec: NonoSpec, seed: number): NonoPuzzle {
  const rng = new Rng(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const picture = randomPicture(spec, rng);
    if (picture.filter(Boolean).length < spec.rows * spec.cols * 0.3) continue;
    for (let round = 0; round < spec.rows * spec.cols; round++) {
      const p = makePuzzle(spec.rows, spec.cols, picture);
      const { grid } = lineSolve(p);
      const open = grid.flatMap((c, i) => (c === UNKNOWN ? [i] : []));
      if (!open.length) return p;
      const flip = open[rng.int(open.length)]!;
      picture[flip] = !picture[flip];
    }
  }
  throw new Error('No nonogram');
}

// ---------------------------------------------------------------- play state

export const DIFFICULTIES: Record<string, NonoSpec> = {
  easy: { rows: 5, cols: 5, density: 0.5 },
  medium: { rows: 10, cols: 10, density: 0.48 },
  hard: { rows: 15, cols: 15, density: 0.48 },
};

interface Change {
  cells: number[];
  before: Cell[];
}

export interface NonoState {
  /** A difficulty id, or `picture:<id>`. */
  kind: string;
  seed: number;
  puzzle: NonoPuzzle;
  grid: Cell[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function puzzleFor(kind: string, seed: number): NonoPuzzle {
  if (kind.startsWith('picture:')) {
    const pic = PICTURES.find((x) => x.id === kind.slice(8));
    if (!pic) throw new Error(`Unknown picture ${kind}`);
    const rows = pic.art.length;
    const cols = pic.art[0]!.length;
    return makePuzzle(
      rows,
      cols,
      pic.art
        .join('')
        .split('')
        .map((ch) => ch === '#'),
      pic.id,
    );
  }
  const spec = DIFFICULTIES[kind];
  if (!spec) throw new Error(`Unknown difficulty ${kind}`);
  return generateNonogram(spec, seed);
}

export function newNonogram(kind: string, seed: number): NonoState {
  const puzzle = puzzleFor(kind, seed);
  return {
    kind,
    seed,
    puzzle,
    grid: puzzle.solution.map(() => UNKNOWN),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

/** Solved when exactly the solution's cells are filled (crosses are only notes). */
export const isSolved = (p: NonoPuzzle, grid: readonly Cell[]) =>
  grid.every((c, i) => (c === FILLED) === p.solution[i]);

/** Sets several cells to their own values in one undoable change. */
export function setValues(
  s: NonoState,
  set: readonly { cell: number; value: Cell }[],
  options: { hint?: boolean } = {},
): NonoState {
  if (s.solved) return s;
  const changed = set.filter(({ cell, value }) => s.grid[cell] !== value);
  if (!changed.length) return s;
  const grid = [...s.grid];
  for (const { cell, value } of changed) grid[cell] = value;
  const wrong = changed.filter(
    ({ cell, value }) =>
      (value === FILLED && !s.puzzle.solution[cell]) ||
      (value === EMPTY && s.puzzle.solution[cell]),
  ).length;
  return {
    ...s,
    grid,
    undo: [
      ...s.undo,
      { cells: changed.map((x) => x.cell), before: changed.map((x) => s.grid[x.cell]!) },
    ].slice(-500),
    redo: [],
    mistakes: s.mistakes + wrong,
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSolved(s.puzzle, grid),
  };
}

export const setCells = (
  s: NonoState,
  cells: readonly number[],
  value: Cell,
  options: { hint?: boolean } = {},
) =>
  setValues(
    s,
    cells.map((cell) => ({ cell, value })),
    options,
  );

function swap(s: NonoState, from: 'undo' | 'redo'): NonoState {
  const last = s[from].at(-1);
  if (!last || s.solved) return s;
  const grid = [...s.grid];
  const back: Change = { cells: last.cells, before: last.cells.map((c) => grid[c]!) };
  last.cells.forEach((c, i) => (grid[c] = last.before[i]!));
  const to = from === 'undo' ? 'redo' : 'undo';
  return {
    ...s,
    grid,
    [from]: s[from].slice(0, -1),
    [to]: [...s[to], back],
    solved: isSolved(s.puzzle, grid),
  };
}

export const undoMove = (s: NonoState) => swap(s, 'undo');
export const redoMove = (s: NonoState) => swap(s, 'redo');

export const wrongCells = (s: NonoState) =>
  s.grid.flatMap((c, i) =>
    (c === FILLED && !s.puzzle.solution[i]) || (c === EMPTY && s.puzzle.solution[i]) ? [i] : [],
  );

/** Whether a line's filled cells already show exactly its clue. */
export function lineDone(clue: readonly number[], cells: readonly Cell[]): boolean {
  const runs = runsOf(cells.map((c) => c === FILLED));
  return runs.length === clue.length && runs.every((x, i) => x === clue[i]);
}

/** The hint: the next line step from the correct marks (wrong marks are left out). */
export function hintStep(s: NonoState): LineStep | null {
  const clean = s.grid.map((c, i) => (wrongCells(s).includes(i) ? UNKNOWN : c));
  return nextLineStep(s.puzzle, clean);
}

const intArray = (a: unknown, len: number, max: number) =>
  Array.isArray(a) && a.length === len && a.every((x) => Number.isInteger(x) && x >= 0 && x <= max);

/** A saved game is valid when its puzzle is exactly the one its kind and seed give. */
export function isValidNonoState(data: unknown): data is NonoState {
  if (!isRecord(data)) return false;
  const d = data as unknown as NonoState;
  if (typeof d.kind !== 'string' || !Number.isInteger(d.seed)) return false;
  if (!Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || !Number.isInteger(d.hints) || typeof d.solved !== 'boolean')
    return false;
  if (!Array.isArray(d.undo) || !Array.isArray(d.redo)) return false;
  let fresh: NonoPuzzle;
  try {
    fresh = puzzleFor(d.kind, d.seed);
  } catch {
    return false;
  }
  if (JSON.stringify(fresh) !== JSON.stringify(d.puzzle)) return false;
  const len = fresh.solution.length;
  if (!intArray(d.grid, len, 2)) return false;
  const ok = (list: unknown[]) =>
    list.every(
      (ch) =>
        isRecord(ch) &&
        Array.isArray(ch.cells) &&
        ch.cells.every((c) => Number.isInteger(c) && (c as number) >= 0 && (c as number) < len) &&
        intArray(ch.before, ch.cells.length, 2),
    );
  return ok(d.undo) && ok(d.redo) && d.solved === isSolved(fresh, d.grid);
}
