/**
 * Queens (colored regions) rules, solver and generator. An n×n grid is split into n colored
 * regions; place n queens so that every row, every column and every region holds exactly one and no
 * two queens touch, not even diagonally. Puzzles are generated from a seed: a queen layout, regions
 * grown around it, kept only when the solution is unique and the technique solver reaches it.
 */
import { Rng } from '../../core/game-engine/random';

export interface QueensPuzzle {
  size: number;
  /** Region id (0..size-1) of each cell, row-major. */
  regions: number[];
  /** Column of the queen in each row. */
  solution: number[];
}

export type Technique = 'single' | 'confined' | 'group' | 'attack';

export interface Step {
  technique: Technique;
  /** Cells that get a queen. */
  place: number[];
  /** Cells ruled out. */
  rule: number[];
  /** What the step reasons about: a line or region index, or the cell tried for 'attack'. */
  kind: 'row' | 'col' | 'region' | 'cell';
  at: number[];
  /** For 'attack': the unit emptied by a queen on `at[0]`. */
  emptied?: { kind: 'row' | 'col' | 'region'; index: number };
}

export const EMPTY = 0;
export const CROSS = 1;
export const QUEEN = 2;

const neighbours = (n: number, c: number) => {
  const r = Math.floor(c / n);
  const k = c % n;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dk = -1; dk <= 1; dk++) {
      if (!dr && !dk) continue;
      const rr = r + dr;
      const kk = k + dk;
      if (rr >= 0 && rr < n && kk >= 0 && kk < n) out.push(rr * n + kk);
    }
  return out;
};

/** The cells of every row, column and region. */
export function units(p: Pick<QueensPuzzle, 'size' | 'regions'>) {
  const n = p.size;
  const rows = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, k) => r * n + k));
  const cols = Array.from({ length: n }, (_, k) => Array.from({ length: n }, (_, r) => r * n + k));
  const regions = Array.from({ length: n }, () => [] as number[]);
  p.regions.forEach((g, c) => regions[g]!.push(c));
  return { rows, cols, regions };
}

/** Cells a queen on `c` rules out (its row, column, region and neighbours). */
export function attacked(p: Pick<QueensPuzzle, 'size' | 'regions'>, c: number): number[] {
  const n = p.size;
  const r = Math.floor(c / n);
  const k = c % n;
  const out = new Set<number>();
  for (let i = 0; i < n; i++) {
    out.add(r * n + i);
    out.add(i * n + k);
  }
  p.regions.forEach((g, x) => g === p.regions[c] && out.add(x));
  for (const x of neighbours(n, c)) out.add(x);
  out.delete(c);
  return [...out];
}

/**
 * Candidates left by the marks: queens rule out what they attack, crosses rule out their cell.
 * Returns null when two queens clash.
 */
export function candidatesFrom(p: QueensPuzzle, marks: readonly number[]): boolean[] | null {
  const cand = marks.map((m) => m !== CROSS);
  for (let c = 0; c < marks.length; c++) {
    if (marks[c] !== QUEEN) continue;
    for (const x of attacked(p, c)) {
      if (marks[x] === QUEEN) return null;
      cand[x] = false;
    }
  }
  return cand;
}

/** The next deduction from the marks (queens and crosses), or null when none applies. */
export function nextStep(p: QueensPuzzle, marks: readonly number[]): Step | null {
  const cand = candidatesFrom(p, marks);
  if (!cand) return null;
  const n = p.size;
  const u = units(p);
  const isQueen = (c: number) => marks[c] === QUEEN;
  const open = (c: number) => cand[c] && !isQueen(c);
  const named: ['row' | 'col' | 'region', number[][]][] = [
    ['row', u.rows],
    ['col', u.cols],
    ['region', u.regions],
  ];
  // Crosses implied by queens already placed come first.
  const implied = marks.flatMap((m, c) => (m === EMPTY && !cand[c] ? [c] : []));
  if (implied.length) {
    const q = marks.findIndex(
      (m, c) => m === QUEEN && attacked(p, c).some((x) => implied.includes(x)),
    );
    if (q >= 0) {
      const rule = attacked(p, q).filter((x) => implied.includes(x));
      return { technique: 'single', place: [], rule, kind: 'cell', at: [q] };
    }
  }
  // Single: a row, column or region with one candidate left and no queen.
  for (const [kind, list] of named)
    for (let i = 0; i < list.length; i++) {
      const cells = list[i]!;
      if (cells.some(isQueen)) continue;
      const left = cells.filter((c) => cand[c]);
      if (left.length === 1) return { technique: 'single', place: left, rule: [], kind, at: [i] };
    }
  // Confined: a region inside one row/column, or a row/column inside one region.
  const rowOf = (c: number) => Math.floor(c / n);
  const colOf = (c: number) => c % n;
  for (let g = 0; g < n; g++) {
    const cells = u.regions[g]!;
    if (cells.some(isQueen)) continue;
    const left = cells.filter(open);
    for (const [kind, of, list] of [
      ['row', rowOf, u.rows],
      ['col', colOf, u.cols],
    ] as const) {
      const lines = new Set(left.map(of));
      if (lines.size !== 1) continue;
      const line = [...lines][0]!;
      const rule = list[line]!.filter((c) => p.regions[c] !== g && open(c));
      if (rule.length) return { technique: 'confined', place: [], rule, kind: 'region', at: [g] };
      void kind;
    }
  }
  for (const [kind, of, list] of [
    ['row', rowOf, u.rows],
    ['col', colOf, u.cols],
  ] as const) {
    void of;
    for (let i = 0; i < n; i++) {
      const cells = list[i]!;
      if (cells.some(isQueen)) continue;
      const gs = new Set(cells.filter(open).map((c) => p.regions[c]!));
      if (gs.size !== 1) continue;
      const g = [...gs][0]!;
      const rule = u.regions[g]!.filter((c) => open(c) && !cells.includes(c));
      if (rule.length) return { technique: 'confined', place: [], rule, kind, at: [i] };
    }
  }
  // Group: k regions whose candidates lie within k rows (or columns), or k lines within k regions.
  const free = Array.from({ length: n }, (_, g) => g).filter((g) => !u.regions[g]!.some(isQueen));
  const subsets = (items: number[], k: number): number[][] => {
    if (k === 0) return [[]];
    const out: number[][] = [];
    items.forEach((x, i) => subsets(items.slice(i + 1), k - 1).forEach((s) => out.push([x, ...s])));
    return out;
  };
  for (let k = 2; k <= Math.min(4, free.length - 1); k++)
    for (const set of subsets(free, k)) {
      const cells = set.flatMap((g) => u.regions[g]!.filter(open));
      for (const [of, list] of [
        [rowOf, u.rows],
        [colOf, u.cols],
      ] as const) {
        const lines = new Set(cells.map(of));
        if (lines.size !== k) continue;
        const rule = [...lines].flatMap((l) =>
          list[l]!.filter((c) => open(c) && !set.includes(p.regions[c]!)),
        );
        if (rule.length) return { technique: 'group', place: [], rule, kind: 'region', at: set };
      }
    }
  for (const [kind, list] of [
    ['row', u.rows],
    ['col', u.cols],
  ] as const) {
    const lines = Array.from({ length: n }, (_, i) => i).filter((i) => !list[i]!.some(isQueen));
    for (let k = 2; k <= Math.min(4, lines.length - 1); k++)
      for (const set of subsets(lines, k)) {
        const cells = set.flatMap((l) => list[l]!.filter(open));
        const gs = new Set(cells.map((c) => p.regions[c]!));
        if (gs.size !== k) continue;
        const rule = [...gs].flatMap((g) =>
          u.regions[g]!.filter((c) => open(c) && !cells.includes(c)),
        );
        if (rule.length) return { technique: 'group', place: [], rule, kind, at: set };
      }
  }
  // Attack: a queen on this cell would leave some row, column or region without a candidate.
  for (let c = 0; c < n * n; c++) {
    if (!open(c)) continue;
    const gone = new Set(attacked(p, c));
    gone.add(c);
    for (const [kind, list] of named)
      for (let i = 0; i < list.length; i++) {
        const cells = list[i]!;
        if (cells.includes(c) || cells.some(isQueen)) continue;
        if (cells.every((x) => !cand[x] || gone.has(x)))
          return {
            technique: 'attack',
            place: [],
            rule: [c],
            kind: 'cell',
            at: [c],
            emptied: { kind, index: i },
          };
      }
  }
  return null;
}

/** Applies a step to the marks. */
export function applyStep(marks: readonly number[], step: Step): number[] {
  const out = [...marks];
  for (const c of step.rule) if (out[c] === EMPTY) out[c] = CROSS;
  for (const c of step.place) out[c] = QUEEN;
  return out;
}

/** Runs the techniques to the end; the hardest technique used, or null if they get stuck. */
export function gradePuzzle(p: QueensPuzzle): {
  solved: boolean;
  hardest: Technique | null;
  steps: number;
} {
  const order: Technique[] = ['single', 'confined', 'group', 'attack'];
  let marks = Array.from({ length: p.size * p.size }, () => EMPTY);
  let hardest = -1;
  let steps = 0;
  for (;;) {
    const s = nextStep(p, marks);
    if (!s) break;
    hardest = Math.max(hardest, order.indexOf(s.technique));
    marks = applyStep(marks, s);
    steps++;
  }
  const solved = marks.filter((m) => m === QUEEN).length === p.size;
  return { solved, hardest: hardest >= 0 ? order[hardest]! : null, steps };
}

/** Exact backtracking by rows; counts solutions up to `limit`. */
export function countSolutions(
  p: Pick<QueensPuzzle, 'size' | 'regions'>,
  limit = 2,
): { count: number; first: number[] | null } {
  const n = p.size;
  const col = new Array<boolean>(n).fill(false);
  const reg = new Array<boolean>(n).fill(false);
  const sol: number[] = [];
  let count = 0;
  let first: number[] | null = null;
  const walk = (r: number) => {
    if (count >= limit) return;
    if (r === n) {
      count++;
      first ??= [...sol];
      return;
    }
    for (let k = 0; k < n; k++) {
      const g = p.regions[r * n + k]!;
      if (col[k] || reg[g]) continue;
      if (r > 0 && Math.abs(sol[r - 1]! - k) <= 1) continue;
      col[k] = reg[g] = true;
      sol[r] = k;
      walk(r + 1);
      col[k] = reg[g] = false;
    }
  };
  walk(0);
  return { count, first };
}

export function queenLayout(n: number, rng: Rng): number[] | null {
  const sol: number[] = [];
  const used = new Set<number>();
  const walk = (r: number): boolean => {
    if (r === n) return true;
    const cols = Array.from({ length: n }, (_, k) => k);
    for (let i = cols.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      [cols[i], cols[j]] = [cols[j]!, cols[i]!];
    }
    for (const k of cols) {
      if (used.has(k) || (r > 0 && Math.abs(sol[r - 1]! - k) <= 1)) continue;
      used.add(k);
      sol[r] = k;
      if (walk(r + 1)) return true;
      used.delete(k);
    }
    return false;
  };
  return walk(0) ? sol : null;
}

/** Regions grown at random around the queens until the grid is covered. */
export function growRegions(n: number, sol: number[], rng: Rng): number[] {
  const regions = new Array<number>(n * n).fill(-1);
  sol.forEach((k, r) => (regions[r * n + k] = r));
  let left = n * n - n;
  while (left > 0) {
    const frontier: [number, number][] = [];
    regions.forEach((g, c) => {
      if (g < 0) return;
      const r = Math.floor(c / n);
      const k = c % n;
      for (const [dr, dk] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const rr = r + dr;
        const kk = k + dk;
        if (rr < 0 || rr >= n || kk < 0 || kk >= n) continue;
        if (regions[rr * n + kk]! < 0) frontier.push([rr * n + kk, g]);
      }
    });
    const [cell, g] = frontier[rng.int(frontier.length)]!;
    if (regions[cell]! >= 0) continue;
    regions[cell] = g;
    left--;
  }
  return regions;
}

/** Whether the cells of region `g` stay connected without `cell`. */
function connectedWithout(n: number, regions: number[], g: number, cell: number): boolean {
  const cells = regions.flatMap((x, c) => (x === g && c !== cell ? [c] : []));
  if (!cells.length) return false;
  const seen = new Set([cells[0]!]);
  const stack = [cells[0]!];
  while (stack.length) {
    const c = stack.pop()!;
    const r = Math.floor(c / n);
    const k = c % n;
    for (const x of [
      r > 0 ? c - n : -1,
      r < n - 1 ? c + n : -1,
      k > 0 ? c - 1 : -1,
      k < n - 1 ? c + 1 : -1,
    ])
      if (x >= 0 && x !== cell && regions[x] === g && !seen.has(x)) {
        seen.add(x);
        stack.push(x);
      }
  }
  return seen.size === cells.length;
}

/**
 * Breaks other solutions: while a second solution exists, one of its queens that is not in the
 * intended layout moves its cell into a neighbouring region (keeping regions connected and the
 * intended queens in place). Returns the regions when the solution became unique.
 */
export function repairRegions(n: number, regions: number[], sol: number[], rng: Rng, tries = 120) {
  const out = [...regions];
  const fixed = new Set(sol.map((k, r) => r * n + k));
  for (let t = 0; t < tries; t++) {
    const found = countSolutions({ size: n, regions: out }, 2);
    if (found.count === 1) return out;
    // The first solution found may be the intended one; look for another.
    let other = found.first;
    if (!other || other.every((k, r) => k === sol[r])) {
      const all = allSolutions({ size: n, regions: out }, 3);
      other = all.find((x) => x.some((k, r) => k !== sol[r])) ?? null;
    }
    if (!other) return out;
    const cells = other.map((k, r) => r * n + k).filter((c) => !fixed.has(c));
    const moves: [number, number][] = [];
    for (const c of cells) {
      const r = Math.floor(c / n);
      const k = c % n;
      for (const x of [
        r > 0 ? c - n : -1,
        r < n - 1 ? c + n : -1,
        k > 0 ? c - 1 : -1,
        k < n - 1 ? c + 1 : -1,
      ]) {
        if (x < 0 || out[x] === out[c]) continue;
        if (connectedWithout(n, out, out[c]!, c)) moves.push([c, out[x]!]);
      }
    }
    if (!moves.length) return null;
    const [cell, g] = moves[rng.int(moves.length)]!;
    out[cell] = g;
  }
  return countSolutions({ size: n, regions: out }, 2).count === 1 ? out : null;
}

export function allSolutions(p: Pick<QueensPuzzle, 'size' | 'regions'>, limit: number): number[][] {
  const n = p.size;
  const col = new Array<boolean>(n).fill(false);
  const reg = new Array<boolean>(n).fill(false);
  const sol: number[] = [];
  const out: number[][] = [];
  const walk = (r: number) => {
    if (out.length >= limit) return;
    if (r === n) {
      out.push([...sol]);
      return;
    }
    for (let k = 0; k < n; k++) {
      const g = p.regions[r * n + k]!;
      if (col[k] || reg[g]) continue;
      if (r > 0 && Math.abs(sol[r - 1]! - k) <= 1) continue;
      col[k] = reg[g] = true;
      sol[r] = k;
      walk(r + 1);
      col[k] = reg[g] = false;
    }
  };
  walk(0);
  return out;
}

export interface Spec {
  size: number;
  /** Techniques allowed for this level, at most. */
  hardest: Technique;
}

export const SPECS: Record<string, Spec> = {
  easy: { size: 6, hardest: 'confined' },
  medium: { size: 8, hardest: 'group' },
  hard: { size: 9, hardest: 'attack' },
  expert: { size: 10, hardest: 'attack' },
};

/** Regions renumbered by first appearance (row-major), so equal layouts compare equal. */
function canonical(regions: number[], sol: number[], n: number) {
  const map = new Map<number, number>();
  const out = regions.map((g) => {
    if (!map.has(g)) map.set(g, map.size);
    return map.get(g)!;
  });
  return { regions: out, solution: sol.slice(0, n) };
}

export function generate(level: string, seed: number): QueensPuzzle {
  const spec = SPECS[level] ?? SPECS.easy!;
  const n = spec.size;
  const order: Technique[] = ['single', 'confined', 'group', 'attack'];
  const rng = new Rng(seed >>> 0);
  let fallback: QueensPuzzle | null = null;
  for (let attempt = 0; attempt < 4000; attempt++) {
    const sol = queenLayout(n, rng);
    if (!sol) continue;
    const regions = repairRegions(n, growRegions(n, sol, rng), sol, rng);
    if (!regions) continue;
    const p: QueensPuzzle = { size: n, ...canonical(regions, sol, n) };
    const g = gradePuzzle(p);
    if (!g.solved) continue;
    const at = order.indexOf(g.hardest ?? 'single');
    if (at > order.indexOf(spec.hardest)) continue;
    // Prefer puzzles that need the level's hardest technique; keep an easier one as a fallback.
    if (at === order.indexOf(spec.hardest) || (level === 'easy' && at >= 1)) return p;
    fallback ??= p;
  }
  if (fallback) return fallback;
  throw new Error(`No queens puzzle for ${level}`);
}

export interface Change {
  cells: number[];
  marks: number[];
}

export interface QueensState {
  level: string;
  seed: number;
  puzzle: QueensPuzzle;
  marks: number[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export const isSolved = (p: QueensPuzzle, marks: readonly number[]) =>
  p.solution.every((k, r) => marks[r * p.size + k] === QUEEN) &&
  marks.filter((m) => m === QUEEN).length === p.size;

export function newQueens(level: string, seed: number): QueensState {
  const lv = SPECS[level] ? level : 'easy';
  const puzzle = generate(lv, seed);
  return {
    level: lv,
    seed: seed >>> 0,
    puzzle,
    marks: Array.from({ length: puzzle.size * puzzle.size }, () => EMPTY),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

const isQueenCell = (p: QueensPuzzle, c: number) =>
  p.solution[Math.floor(c / p.size)] === c % p.size;

export function setMarks(
  s: QueensState,
  set: { cell: number; mark: number }[],
  options: { hint?: boolean } = {},
): QueensState {
  if (s.solved) return s;
  const changed = set.filter(({ cell, mark }) => s.marks[cell] !== mark);
  if (!changed.length) return s;
  const marks = [...s.marks];
  for (const { cell, mark } of changed) marks[cell] = mark;
  const wrong = changed.filter(
    ({ cell, mark }) =>
      (mark === QUEEN && !isQueenCell(s.puzzle, cell)) ||
      (mark === CROSS && isQueenCell(s.puzzle, cell)),
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

function swap(s: QueensState, from: 'undo' | 'redo'): QueensState {
  const list = s[from];
  const ch = list[list.length - 1];
  if (!ch || s.solved) return s;
  const marks = [...s.marks];
  const back = { cells: ch.cells, marks: ch.cells.map((c) => s.marks[c]!) };
  ch.cells.forEach((c, i) => (marks[c] = ch.marks[i]!));
  const to = from === 'undo' ? 'redo' : 'undo';
  return { ...s, marks, [from]: list.slice(0, -1), [to]: [...s[to], back] };
}
export const undoMove = (s: QueensState) => swap(s, 'undo');
export const redoMove = (s: QueensState) => swap(s, 'redo');

/** Cells breaking a rule now: queens sharing a row, column or region, or touching. */
export function clashes(s: Pick<QueensState, 'puzzle' | 'marks'>): Set<number> {
  const p = s.puzzle;
  const out = new Set<number>();
  s.marks.forEach((m, c) => {
    if (m !== QUEEN) return;
    for (const x of attacked(p, c))
      if (s.marks[x] === QUEEN) {
        out.add(c);
        out.add(x);
      }
  });
  return out;
}

/** Marks that disagree with the solution (a queen off it, a cross on it). */
export const wrongCells = (s: QueensState) =>
  s.marks.flatMap((m, c) =>
    (m === QUEEN && !isQueenCell(s.puzzle, c)) || (m === CROSS && isQueenCell(s.puzzle, c))
      ? [c]
      : [],
  );

export const hintStep = (s: QueensState) => nextStep(s.puzzle, s.marks);

const intArray = (a: unknown, len: number, max: number) =>
  Array.isArray(a) &&
  a.length === len &&
  a.every((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= max);

export function isValidQueensState(data: unknown): data is QueensState {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as QueensState;
  if (typeof d.level !== 'string' || !(d.level in SPECS)) return false;
  if (!Number.isInteger(d.seed) || d.seed < 0 || d.seed > 0xffffffff) return false;
  if (!Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || d.mistakes < 0 || !Number.isInteger(d.hints) || d.hints < 0)
    return false;
  if (typeof d.solved !== 'boolean' || !Array.isArray(d.undo) || !Array.isArray(d.redo))
    return false;
  const fresh = generate(d.level, d.seed);
  if (JSON.stringify(fresh) !== JSON.stringify(d.puzzle)) return false;
  const len = fresh.size * fresh.size;
  if (!intArray(d.marks, len, 2)) return false;
  const ok = (list: unknown[]) =>
    list.every((ch) => {
      const c = ch as Change;
      return (
        typeof c === 'object' &&
        c !== null &&
        intArray(c.cells, Array.isArray(c.cells) ? c.cells.length : -1, len - 1) &&
        intArray(c.marks, c.cells.length, 2)
      );
    });
  return ok(d.undo) && ok(d.redo) && d.solved === isSolved(fresh, d.marks);
}
