/**
 * A sudoku being played: the puzzle and its solution, the player's digits and pencil marks, undo
 * and redo, mistakes (digits that differ from the solution) and hints. Shared by every sudoku
 * variant; the variant gives the shape and the puzzle specs of its difficulties.
 */
import { isRecord } from '../../../core/persistence/versioned';
import { generatePuzzle, type PuzzleSpec } from './generator';
import { bit, geometry, type Geometry, type Shape } from './grid';
import { calcExtra, calcSteps, cageValue, generateCalc, type CalcCage } from './calc';
import { jigsawRegions, regionsConnected } from './jigsaw';
import { drawSigns, signExtra, signSteps, type Sign } from './signs';
import { cageExtra, generateKiller, killerSteps, type Cage } from './killer';
import { gradePuzzle, type StepExtra } from './logic';
import { randomSolution, solveSudoku, type Extra } from './solver';
import { Rng } from '../../../core/game-engine/random';

export interface SudokuVariant {
  id: string;
  shape: Shape;
  /** Difficulty ids in order, with the puzzles they generate. */
  difficulties: Record<string, PuzzleSpec>;
}

/** Cells changed by one move, with what they held before. */
interface Change {
  cells: number[];
  values: number[];
  notes: number[];
}

export interface SudokuState {
  difficulty: string;
  seed: number;
  puzzle: number[];
  solution: number[];
  values: number[];
  /** Pencil marks: a digit mask per cell. */
  notes: number[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
  /** Killer sudoku cages (no givens then). */
  cages?: Cage[];
  /** Jigsaw sudoku: this puzzle's region of every cell. */
  regions?: number[];
  /** Calcudoku: arithmetic cages (no givens then). */
  calc?: CalcCage[];
  /** Futoshiki: inequality signs between neighbours. */
  signs?: Sign[];
}

/** The constraints and techniques beyond the units that a puzzle brings (its killer cages). */
export function rulesOf(
  geo: Geometry,
  s: { cages?: readonly Cage[]; calc?: readonly CalcCage[]; signs?: readonly Sign[] },
): { extra?: Extra; steps: StepExtra[] } {
  if (s.cages) return { extra: cageExtra(geo, s.cages), steps: killerSteps(s.cages) };
  if (s.calc) return { extra: calcExtra(geo, s.calc), steps: calcSteps(s.calc) };
  if (s.signs) return { extra: signExtra(geo, s.signs), steps: signSteps(s.signs) };
  return { steps: [] };
}

export const geoOf = (v: SudokuVariant): Geometry => geometry(v.shape);

/** The grid shape of a difficulty (a variant may size its difficulties differently). */
export const shapeFor = (v: SudokuVariant, difficulty: string): Shape =>
  v.difficulties[difficulty]?.shape ?? v.shape;

/**
 * The geometry of one puzzle: its difficulty's shape, with the puzzle's own regions for jigsaw
 * sudoku.
 */
export const geoFor = (
  v: SudokuVariant,
  s: { difficulty: string; regions?: readonly number[] },
): Geometry => {
  const shape = shapeFor(v, s.difficulty);
  return geometry(s.regions ? { ...shape, regions: s.regions } : shape);
};

export function newSudoku(v: SudokuVariant, difficulty: string, seed: number): SudokuState {
  const spec = v.difficulties[difficulty];
  if (!spec) throw new Error(`Unknown difficulty ${difficulty}`);
  const shape = shapeFor(v, difficulty);
  let geo = geometry(shape);
  let puzzle: number[];
  let solution: number[];
  let cages: Cage[] | undefined;
  let regions: number[] | undefined;
  let calc: CalcCage[] | undefined;
  let signs: Sign[] | undefined;
  if (spec.jigsaw) {
    // Fresh regions for every puzzle (retried in the rare case no grid fits them).
    const rng = new Rng(seed ^ 0x5bd1e995);
    for (;;) {
      regions = jigsawRegions(shape, rng);
      geo = geometry({ ...shape, regions });
      try {
        randomSolution(geo, new Rng(seed));
        break;
      } catch {
        // Try other regions.
      }
    }
  }
  if (spec.calc) {
    // Calcudoku: arithmetic cages until unique, kept when the techniques' level is in range.
    const k = generateCalc(
      geo,
      seed,
      { ...spec.calc, maxNodes: spec.maxNodes ?? 4000 },
      (c) => {
        const level = gradePuzzle(geo, Array<number>(geo.cells).fill(0), calcSteps(c)).level;
        return level >= spec.minLevel && level <= spec.maxLevel;
      },
      spec.attempts,
    );
    puzzle = Array<number>(geo.cells).fill(0);
    solution = k.solution;
    calc = k.cages;
  } else if (spec.cages) {
    // Killer: cages drawn until unique, kept when the techniques' level is in range.
    const k = generateKiller(
      geo,
      seed,
      { ...spec.cages, maxNodes: spec.maxNodes ?? 4000 },
      (c) => {
        const level = gradePuzzle(geo, Array<number>(geo.cells).fill(0), killerSteps(c)).level;
        return level >= spec.minLevel && level <= spec.maxLevel;
      },
      spec.attempts,
    );
    puzzle = Array<number>(geo.cells).fill(0);
    solution = k.solution;
    cages = k.cages;
  } else if (spec.signs !== undefined) {
    // Futoshiki: signs drawn over each candidate solution, then givens removed.
    const share = spec.signs;
    const p = generatePuzzle<Sign[]>(geo, seed, spec, (sol, rng) => {
      const drawn = drawSigns(geo, sol, rng, share);
      return { extra: signExtra(geo, drawn), steps: signSteps(drawn), data: drawn };
    });
    puzzle = p.puzzle;
    solution = p.solution;
    signs = p.data;
  } else {
    const p = generatePuzzle(geo, seed, spec);
    puzzle = p.puzzle;
    solution = p.solution;
  }
  return {
    difficulty,
    seed,
    puzzle,
    solution,
    values: [...puzzle],
    notes: puzzle.map(() => 0),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
    ...(cages ? { cages } : {}),
    ...(regions ? { regions } : {}),
    ...(calc ? { calc } : {}),
    ...(signs ? { signs } : {}),
  };
}

const UNDO_LIMIT = 500;

/** Applies a change made by `edit` (which mutates the copies) and records it for undo. */
function change(
  s: SudokuState,
  cells: number[],
  edit: (values: number[], notes: number[]) => void,
) {
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

const finish = (s: SudokuState): SudokuState => ({
  ...s,
  solved: s.values.every((x, c) => x === s.solution[c]),
});

/** Places a digit (or clears the cell when it already holds it), cleaning the peers' notes. */
export function placeDigit(
  v: SudokuVariant,
  s: SudokuState,
  cell: number,
  digit: number,
  options: { autoNotes?: boolean; hint?: boolean } = {},
): SudokuState {
  if (s.solved || s.puzzle[cell] || digit < 1 || digit > shapeFor(v, s.difficulty).size) return s;
  const geo = geoFor(v, s);
  const clearing = s.values[cell] === digit;
  const cells = [cell, ...(options.autoNotes === false || clearing ? [] : geo.peers[cell]!)];
  const next = change(s, cells, (values, notes) => {
    values[cell] = clearing ? 0 : digit;
    notes[cell] = 0;
    if (!clearing && options.autoNotes !== false)
      for (const p of geo.peers[cell]!) notes[p]! &= ~bit(digit);
  });
  if (next === s) return s;
  const wrong = !clearing && digit !== s.solution[cell];
  return finish({
    ...next,
    mistakes: s.mistakes + (wrong ? 1 : 0),
    hints: s.hints + (options.hint ? 1 : 0),
  });
}

export function toggleNote(s: SudokuState, cell: number, digit: number): SudokuState {
  if (s.solved || s.values[cell]) return s;
  return change(s, [cell], (_values, notes) => {
    notes[cell]! ^= bit(digit);
  });
}

export function eraseCell(s: SudokuState, cell: number): SudokuState {
  if (s.solved || s.puzzle[cell]) return s;
  return change(s, [cell], (values, notes) => {
    values[cell] = 0;
    notes[cell] = 0;
  });
}

/** Fills every empty cell's notes with its candidates. */
export function fillNotes(v: SudokuVariant, s: SudokuState): SudokuState {
  if (s.solved) return s;
  const geo = geoFor(v, s);
  const empty = s.values.flatMap((x, c) => (x ? [] : [c]));
  return change(s, empty, (values, notes) => {
    for (const c of empty) {
      let m = geo.all;
      for (const p of geo.peers[c]!) if (values[p]) m &= ~bit(values[p]!);
      notes[c] = m;
    }
  });
}

export function undoMove(s: SudokuState): SudokuState {
  const last = s.undo.at(-1);
  if (!last || s.solved) return s;
  const values = [...s.values];
  const notes = [...s.notes];
  const redo: Change = {
    cells: last.cells,
    values: last.cells.map((c) => values[c]!),
    notes: last.cells.map((c) => notes[c]!),
  };
  last.cells.forEach((c, i) => {
    values[c] = last.values[i]!;
    notes[c] = last.notes[i]!;
  });
  return { ...s, values, notes, undo: s.undo.slice(0, -1), redo: [...s.redo, redo] };
}

export function redoMove(s: SudokuState): SudokuState {
  const last = s.redo.at(-1);
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
  return finish({ ...s, values, notes, redo: s.redo.slice(0, -1), undo: [...s.undo, back] });
}

/** Digits that differ from the solution. */
export const wrongCells = (s: SudokuState) =>
  s.values.flatMap((x, c) => (x && x !== s.solution[c] ? [c] : []));

const isIntArray = (a: unknown, n: number, max: number) =>
  Array.isArray(a) &&
  a.length === n &&
  a.every((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= max);

/** Checks a saved game: shapes and ranges, givens kept, and a solution the puzzle forces. */
export function isValidSudokuState(v: SudokuVariant, data: unknown): data is SudokuState {
  if (!isRecord(data)) return false;
  const d = data as unknown as SudokuState;
  if (typeof d.difficulty !== 'string' || !(d.difficulty in v.difficulties)) return false;
  const size = shapeFor(v, d.difficulty).size;
  if (d.regions !== undefined) {
    // Jigsaw: n connected regions of n cells each.
    if (!isIntArray(d.regions, size * size, size - 1)) return false;
    const counts = Array<number>(size).fill(0);
    for (const k of d.regions) counts[k]!++;
    if (counts.some((x) => x !== size) || !regionsConnected(size, d.regions)) return false;
  }
  const geo = geoFor(v, d);
  const n = geo.cells;
  if (typeof d.difficulty !== 'string' || !(d.difficulty in v.difficulties)) return false;
  if (!Number.isInteger(d.seed) || !Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || !Number.isInteger(d.hints)) return false;
  if (typeof d.solved !== 'boolean' || !Array.isArray(d.undo) || !Array.isArray(d.redo))
    return false;
  if (
    !isIntArray(d.puzzle, n, geo.size) ||
    !isIntArray(d.solution, n, geo.size) ||
    !isIntArray(d.values, n, geo.size) ||
    !isIntArray(d.notes, n, geo.all)
  )
    return false;
  if (d.puzzle.some((x, c) => x && (x !== d.solution[c] || d.values[c] !== x))) return false;
  const changesOk = (list: unknown[]) =>
    list.every(
      (ch) =>
        isRecord(ch) &&
        Array.isArray(ch.cells) &&
        ch.cells.every((c) => Number.isInteger(c) && (c as number) >= 0 && (c as number) < n) &&
        isIntArray(ch.values, ch.cells.length, geo.size) &&
        isIntArray(ch.notes, ch.cells.length, geo.all),
    );
  if (!changesOk(d.undo) || !changesOk(d.redo)) return false;
  if (d.cages !== undefined) {
    // Cages: a partition of the grid whose sums match the solution, digits distinct in each.
    if (!Array.isArray(d.cages)) return false;
    const seen = new Set<number>();
    for (const cage of d.cages as unknown[]) {
      if (!isRecord(cage) || !Array.isArray(cage.cells) || !Number.isInteger(cage.sum))
        return false;
      const cells = cage.cells as unknown[];
      if (
        !cells.length ||
        !cells.every(
          (c) =>
            Number.isInteger(c) &&
            (c as number) >= 0 &&
            (c as number) < n &&
            !seen.has(c as number),
        )
      )
        return false;
      cells.forEach((c) => seen.add(c as number));
      const digits = cells.map((c) => d.solution[c as number]!);
      if (new Set(digits).size !== digits.length) return false;
      if (digits.reduce((a, b) => a + b, 0) !== cage.sum) return false;
    }
    if (seen.size !== n) return false;
  }
  if (d.calc !== undefined) {
    // Arithmetic cages: a partition of the grid whose targets match the solution.
    if (!Array.isArray(d.calc)) return false;
    const seen = new Set<number>();
    for (const cage of d.calc as unknown[]) {
      if (!isRecord(cage) || !Array.isArray(cage.cells) || !Number.isInteger(cage.target))
        return false;
      if (!['+', '-', '*', '/', '='].includes(cage.op as string)) return false;
      const cells = cage.cells as unknown[];
      if (
        !cells.length ||
        !cells.every(
          (c) =>
            Number.isInteger(c) &&
            (c as number) >= 0 &&
            (c as number) < n &&
            !seen.has(c as number),
        )
      )
        return false;
      if (['-', '/', '='].includes(cage.op as string) && cells.length !== (cage.op === '=' ? 1 : 2))
        return false;
      cells.forEach((c) => seen.add(c as number));
      const digits = cells.map((c) => d.solution[c as number]!);
      if (cageValue(cage.op as CalcCage['op'], digits) !== cage.target) return false;
    }
    if (seen.size !== n) return false;
  }
  if (d.signs !== undefined) {
    // Signs: between orthogonal neighbours, true of the solution.
    if (!Array.isArray(d.signs)) return false;
    for (const sign of d.signs as unknown[]) {
      if (!isRecord(sign) || !Number.isInteger(sign.less) || !Number.isInteger(sign.more))
        return false;
      const a = sign.less as number;
      const b = sign.more as number;
      if (a < 0 || b < 0 || a >= n || b >= n) return false;
      const near =
        Math.abs(a - b) === size ||
        (Math.abs(a - b) === 1 && Math.floor(a / size) === Math.floor(b / size));
      if (!near || d.solution[a]! >= d.solution[b]!) return false;
    }
  }
  const solved = solveSudoku(geo, d.puzzle, { limit: 2, extra: rulesOf(geo, d).extra });
  return (
    solved.count === 1 &&
    solved.solution!.every((x, c) => x === d.solution[c]) &&
    d.solved === d.values.every((x, c) => x === d.solution[c])
  );
}
