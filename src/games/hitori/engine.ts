/**
 * Hitori (#111): shade cells of a numbered grid so that
 *
 * 1. no number appears twice among the unshaded cells of a row or column,
 * 2. shaded cells never touch side by side, and
 * 3. the unshaded cells form one orthogonally connected area.
 *
 * Only a cell whose number repeats in its row or column is ever shaded. Every puzzle has exactly
 * one solution. Puzzles are generated from a seed: a random Latin square, a random scattered set
 * of cells to shade (keeping the rest connected), each shaded cell renumbered to repeat a number
 * of its row or column, then checked by the exact solver (and the technique solver for hints).
 */
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const WHITE = 1;
export const BLACK = 2;
/** Cell marks: 0 undecided, 1 white (kept), 2 black (shaded). */
export type Mark = 0 | 1 | 2;

export interface HitoriPuzzle {
  size: number;
  numbers: number[];
  /** True for the cells to shade. */
  solution: boolean[];
}

const neighbours = (n: number, c: number) => {
  const r = Math.floor(c / n);
  const k = c % n;
  return [
    r > 0 ? c - n : -1,
    r < n - 1 ? c + n : -1,
    k > 0 ? c - 1 : -1,
    k < n - 1 ? c + 1 : -1,
  ].filter((x) => x >= 0);
};

/** The other cells of the row and column holding the same number. */
export function twins(p: Pick<HitoriPuzzle, 'size' | 'numbers'>): number[][] {
  const n = p.size;
  return p.numbers.map((v, c) => {
    const r = Math.floor(c / n);
    const k = c % n;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i !== k && p.numbers[r * n + i] === v) out.push(r * n + i);
      if (i !== r && p.numbers[i * n + k] === v) out.push(i * n + k);
    }
    return out;
  });
}

/** Whether the non-black cells are one connected area. */
export function whiteConnected(n: number, marks: readonly Mark[]): boolean {
  const start = marks.findIndex((m) => m !== BLACK);
  if (start < 0) return false;
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const c = stack.pop()!;
    for (const x of neighbours(n, c))
      if (marks[x] !== BLACK && !seen.has(x)) {
        seen.add(x);
        stack.push(x);
      }
  }
  return seen.size === marks.filter((m) => m !== BLACK).length;
}

// ---------------------------------------------------------------- techniques

export type Technique =
  'next-to-black' | 'twin-of-white' | 'sandwich' | 'adjacent-pair' | 'connection';

export const TECHNIQUE_LEVEL: Record<Technique, number> = {
  'next-to-black': 1,
  'twin-of-white': 1,
  sandwich: 1,
  'adjacent-pair': 1,
  connection: 2,
};

export interface Step {
  technique: Technique;
  /** Cells decided, with their colour. */
  set: { cell: number; mark: 1 | 2 }[];
  /** Cells the reasoning looks at. */
  cells: number[];
}

/**
 * The easiest deduction from the current marks, or null. Cells whose number is alone in its row
 * and column count as white without being marked.
 */
export function nextStep(p: HitoriPuzzle, given: readonly Mark[], tw = twins(p)): Step | null {
  const n = p.size;
  const marks = given.map((m, c) => (m || tw[c]!.length ? m : WHITE));
  const one = (technique: Technique, cell: number, mark: 1 | 2, cells: number[]): Step => ({
    technique,
    set: [{ cell, mark }],
    cells,
  });
  for (let c = 0; c < marks.length; c++) {
    if (marks[c] === BLACK)
      for (const x of neighbours(n, c))
        if (!marks[x]) return one('next-to-black', x, WHITE, [c, x]);
    if (marks[c] === WHITE)
      for (const x of tw[c]!) if (!marks[x]) return one('twin-of-white', x, BLACK, [c, x]);
  }
  // A B A in a line: B stays white (shading it would keep both A's white).
  for (let c = 0; c < marks.length; c++) {
    if (marks[c]) continue;
    const r = Math.floor(c / n);
    const k = c % n;
    if (k > 0 && k < n - 1 && p.numbers[c - 1] === p.numbers[c + 1])
      return one('sandwich', c, WHITE, [c - 1, c, c + 1]);
    if (r > 0 && r < n - 1 && p.numbers[c - n] === p.numbers[c + n])
      return one('sandwich', c, WHITE, [c - n, c, c + n]);
  }
  // A A side by side: one of them stays white, so any other A of that line is shaded.
  for (let c = 0; c < marks.length; c++) {
    const r = Math.floor(c / n);
    const k = c % n;
    for (const [d, line] of [
      [1, (i: number) => r * n + i],
      [n, (i: number) => i * n + k],
    ] as const) {
      const x = c + d;
      if ((d === 1 && k === n - 1) || x >= marks.length || p.numbers[x] !== p.numbers[c]) continue;
      for (let i = 0; i < n; i++) {
        const y = line(i);
        if (y !== c && y !== x && p.numbers[y] === p.numbers[c] && !marks[y])
          return one('adjacent-pair', y, BLACK, [c, x, y]);
      }
    }
  }
  // Shading a cell that would cut the white area in two keeps it white.
  for (let c = 0; c < marks.length; c++) {
    if (marks[c] || !tw[c]!.length) continue;
    const trial = [...marks];
    trial[c] = BLACK;
    if (!whiteConnected(n, trial)) return one('connection', c, WHITE, [c]);
  }
  return null;
}

/** Marks implied by a step, applied in place. */
export function applyStep(marks: Mark[], step: Step) {
  for (const { cell, mark } of step.set) marks[cell] = mark;
}

/** Solves with the techniques; returns the marks and the hardest level used (4 if stuck). */
export function logicSolve(p: HitoriPuzzle): {
  marks: Mark[];
  level: number;
  used: Partial<Record<Technique, number>>;
} {
  const tw = twins(p);
  const marks: Mark[] = p.numbers.map((_, c) => (tw[c]!.length ? 0 : WHITE));
  let level = 1;
  const used: Partial<Record<Technique, number>> = {};
  for (let i = 0; i < marks.length * 2; i++) {
    if (marks.every((m) => m)) return { marks, level, used };
    const step = nextStep(p, marks, tw);
    if (!step) break;
    level = Math.max(level, TECHNIQUE_LEVEL[step.technique]);
    used[step.technique] = (used[step.technique] ?? 0) + 1;
    applyStep(marks, step);
  }
  return { marks, level: marks.every((m) => m) ? level : 4, used };
}

// ---------------------------------------------------------------- exact solver

/** Counts shadings that satisfy the rules (stops at `limit`); cells without twins stay white. */
export function countSolutions(
  p: Pick<HitoriPuzzle, 'size' | 'numbers'>,
  limit = 2,
  maxNodes = 50000,
): { count: number; first: boolean[] | null; aborted: boolean } {
  const n = p.size;
  const tw = twins(p);
  const result = { count: 0, first: null as boolean[] | null, aborted: false };
  let nodes = 0;
  const propagate = (marks: Mark[]): boolean => {
    for (let changed = true; changed;) {
      changed = false;
      for (let c = 0; c < marks.length; c++) {
        if (!marks[c] && !tw[c]!.length) {
          marks[c] = WHITE;
          changed = true;
        }
        if (marks[c] === BLACK)
          for (const x of neighbours(n, c)) {
            if (marks[x] === BLACK) return false;
            if (!marks[x]) {
              marks[x] = WHITE;
              changed = true;
            }
          }
        if (marks[c] === WHITE)
          for (const x of tw[c]!) {
            if (marks[x] === WHITE) return false;
            if (!marks[x]) {
              marks[x] = BLACK;
              changed = true;
            }
          }
      }
      if (!whiteConnected(n, marks)) return false;
    }
    return true;
  };
  const search = (marks: Mark[]) => {
    if (++nodes > maxNodes) {
      result.aborted = true;
      return;
    }
    if (!propagate(marks)) return;
    const c = marks.findIndex((m) => !m);
    if (c < 0) {
      result.count++;
      result.first ??= marks.map((m) => m === BLACK);
      return;
    }
    for (const mark of [BLACK, WHITE] as const) {
      const next = [...marks];
      next[c] = mark;
      search(next);
      if (result.count >= limit || result.aborted) return;
    }
  };
  search(p.numbers.map(() => 0));
  return result;
}

// ---------------------------------------------------------------- generator

export interface HitoriSpec {
  size: number;
  /** Share of cells to try to shade. */
  density: number;
  /** Renumberings of the shaded cells tried per layout. */
  renumbers: number;
  minLevel: number;
  maxLevel: number;
}

function latinSquare(n: number, rng: Rng): number[] {
  // A shifted base square with shuffled rows, columns and symbols.
  const rows = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const cols = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const syms = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1));
  return Array.from(
    { length: n * n },
    (_, c) => syms[(rows[Math.floor(c / n)]! + cols[c % n]!) % n]!,
  );
}

export function generateHitori(spec: HitoriSpec, seed: number): HitoriPuzzle {
  const rng = new Rng(seed);
  const n = spec.size;
  let best: HitoriPuzzle | null = null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const numbers = latinSquare(n, rng);
    // Scattered black cells, never touching, never cutting the white area.
    const marks: Mark[] = numbers.map(() => 0);
    for (const c of rng.shuffle(Array.from({ length: n * n }, (_, i) => i))) {
      if (rng.float() > spec.density * 1.6) continue;
      if (neighbours(n, c).some((x) => marks[x] === BLACK)) continue;
      marks[c] = BLACK;
      if (!whiteConnected(n, marks)) marks[c] = 0;
    }
    const black = marks.map((m) => m === BLACK);
    const base = [...numbers];
    for (let draw = 0; draw < spec.renumbers; draw++) {
      // Each black cell repeats a number of a white cell in its row or column.
      const nums = [...base];
      for (let c = 0; c < n * n; c++) {
        if (!black[c]) continue;
        const r = Math.floor(c / n);
        const k = c % n;
        const line = rng.float() < 0.5;
        const options = Array.from({ length: n }, (_, i) => (line ? r * n + i : i * n + k)).filter(
          (x) => x !== c && !black[x],
        );
        nums[c] = nums[options[rng.int(options.length)]!]!;
      }
      const p: HitoriPuzzle = { size: n, numbers: nums, solution: black };
      const r = countSolutions(p, 2);
      if (r.count !== 1 || r.aborted) continue;
      const { level } = logicSolve(p);
      if (level > spec.maxLevel) continue;
      if (level >= spec.minLevel) return p;
      best ??= p;
    }
  }
  if (!best) throw new Error('No hitori puzzle');
  return best;
}

// ---------------------------------------------------------------- play state

export const DIFFICULTIES: Record<string, HitoriSpec> = {
  easy: { size: 5, density: 0.22, minLevel: 1, maxLevel: 1, renumbers: 4 },
  medium: { size: 7, density: 0.25, minLevel: 2, maxLevel: 2, renumbers: 6 },
  hard: { size: 8, density: 0.27, minLevel: 2, maxLevel: 2, renumbers: 8 },
  expert: { size: 10, density: 0.28, minLevel: 2, maxLevel: 2, renumbers: 12 },
};

interface Change {
  cells: number[];
  marks: Mark[];
}

export interface HitoriState {
  difficulty: string;
  seed: number;
  puzzle: HitoriPuzzle;
  marks: Mark[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newHitori(difficulty: string, seed: number): HitoriState {
  const spec = DIFFICULTIES[difficulty];
  if (!spec) throw new Error(`Unknown difficulty ${difficulty}`);
  const puzzle = generateHitori(spec, seed);
  return {
    difficulty,
    seed,
    puzzle,
    marks: puzzle.numbers.map(() => 0),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

/** The shading is complete and right: exactly the solution's cells are black. */
export const isSolved = (p: HitoriPuzzle, marks: readonly Mark[]) =>
  marks.every((m, c) => (m === BLACK) === p.solution[c]);

/** Sets marks on cells (undoable); counts a mistake for a mark that contradicts the solution. */
export function setMarks(
  s: HitoriState,
  set: { cell: number; mark: Mark }[],
  options: { hint?: boolean } = {},
): HitoriState {
  if (s.solved) return s;
  const changed = set.filter(({ cell, mark }) => s.marks[cell] !== mark);
  if (!changed.length) return s;
  const marks = [...s.marks];
  for (const { cell, mark } of changed) marks[cell] = mark;
  const wrong = changed.filter(
    ({ cell, mark }) => mark && (mark === BLACK) !== s.puzzle.solution[cell],
  ).length;
  return {
    ...s,
    marks,
    undo: [
      ...s.undo,
      { cells: changed.map((x) => x.cell), marks: changed.map((x) => s.marks[x.cell]!) },
    ].slice(-500),
    redo: [],
    mistakes: s.mistakes + wrong,
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSolved(s.puzzle, marks),
  };
}

/** Cycles a cell: undecided → black → white (kept) → undecided. */
export const cycleMark = (m: Mark): Mark => (m === 0 ? BLACK : m === BLACK ? WHITE : 0);

function swap(s: HitoriState, from: 'undo' | 'redo'): HitoriState {
  const last = s[from].at(-1);
  if (!last || s.solved) return s;
  const marks = [...s.marks];
  const back: Change = { cells: last.cells, marks: last.cells.map((c) => marks[c]!) };
  last.cells.forEach((c, i) => (marks[c] = last.marks[i]!));
  const to = from === 'undo' ? 'redo' : 'undo';
  return {
    ...s,
    marks,
    [from]: s[from].slice(0, -1),
    [to]: [...s[to], back],
    solved: isSolved(s.puzzle, marks),
  };
}

export const undoMove = (s: HitoriState) => swap(s, 'undo');
export const redoMove = (s: HitoriState) => swap(s, 'redo');

/** Rule breaks among the marks: repeated white numbers, touching blacks, a cut-off white area. */
export function ruleBreaks(s: HitoriState): {
  repeats: Set<number>;
  touching: Set<number>;
  split: boolean;
} {
  const n = s.puzzle.size;
  const tw = twins(s.puzzle);
  const repeats = new Set<number>();
  const touching = new Set<number>();
  s.marks.forEach((m, c) => {
    if (m === WHITE && tw[c]!.some((x) => s.marks[x] === WHITE)) repeats.add(c);
    if (m === BLACK && neighbours(n, c).some((x) => s.marks[x] === BLACK)) touching.add(c);
  });
  return { repeats, touching, split: !whiteConnected(n, s.marks) };
}

export const wrongCells = (s: HitoriState) =>
  s.marks.flatMap((m, c) => (m && (m === BLACK) !== s.puzzle.solution[c] ? [c] : []));

/** Steps from the current marks to the next decision (wrong marks ignored). */
export function hintStep(s: HitoriState): Step | null {
  return nextStep(s.puzzle, s.marks);
}

const intArray = (a: unknown, len: number, max: number) =>
  Array.isArray(a) && a.length === len && a.every((x) => Number.isInteger(x) && x >= 0 && x <= max);

/** A saved game is valid when its puzzle is exactly the one its seed generates. */
export function isValidHitoriState(data: unknown): data is HitoriState {
  if (!isRecord(data)) return false;
  const d = data as unknown as HitoriState;
  if (typeof d.difficulty !== 'string' || !(d.difficulty in DIFFICULTIES)) return false;
  if (!Number.isInteger(d.seed) || !Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || !Number.isInteger(d.hints) || typeof d.solved !== 'boolean')
    return false;
  if (!Array.isArray(d.undo) || !Array.isArray(d.redo)) return false;
  const fresh = newHitori(d.difficulty, d.seed).puzzle;
  if (JSON.stringify(fresh) !== JSON.stringify(d.puzzle)) return false;
  const len = fresh.numbers.length;
  if (!intArray(d.marks, len, 2)) return false;
  const ok = (list: unknown[]) =>
    list.every(
      (ch) =>
        isRecord(ch) &&
        Array.isArray(ch.cells) &&
        ch.cells.every((c) => Number.isInteger(c) && (c as number) >= 0 && (c as number) < len) &&
        intArray(ch.marks, ch.cells.length, 2),
    );
  return ok(d.undo) && ok(d.redo) && d.solved === isSolved(fresh, d.marks);
}
