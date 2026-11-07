/**
 * Nurikabe (#115): shade cells (the sea) so that
 *
 * 1. every unshaded area (an island) holds exactly one number, equal to its size;
 * 2. all shaded cells are connected;
 * 3. no 2×2 block is entirely shaded.
 *
 * Puzzles are generated from a seed: islands grown from random cells to random sizes while the sea
 * stays connected and pool-free, each numbered by its size, and kept when the exact solver finds
 * exactly one shading and the technique solver reaches it.
 */
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const UNKNOWN = 0;
export const LAND = 1;
export const SEA = 2;
export type Mark = 0 | 1 | 2;

export interface NuriPuzzle {
  rows: number;
  cols: number;
  /** Island sizes on their numbered cell (0 elsewhere). */
  numbers: number[];
  /** True for sea cells. */
  solution: boolean[];
}

const nbrs = (rows: number, cols: number, c: number) => {
  const r = Math.floor(c / cols);
  const k = c % cols;
  return [
    r > 0 ? c - cols : -1,
    r < rows - 1 ? c + cols : -1,
    k > 0 ? c - 1 : -1,
    k < cols - 1 ? c + 1 : -1,
  ].filter((x) => x >= 0);
};

/** Connected areas of cells matching `test`. */
function areas(rows: number, cols: number, test: (c: number) => boolean): number[][] {
  const seen = new Set<number>();
  const out: number[][] = [];
  for (let c = 0; c < rows * cols; c++) {
    if (!test(c) || seen.has(c)) continue;
    const area = [c];
    seen.add(c);
    for (let i = 0; i < area.length; i++)
      for (const x of nbrs(rows, cols, area[i]!))
        if (test(x) && !seen.has(x)) {
          seen.add(x);
          area.push(x);
        }
    out.push(area);
  }
  return out;
}

const hasPool = (rows: number, cols: number, sea: (c: number) => boolean) => {
  for (let r = 0; r < rows - 1; r++)
    for (let k = 0; k < cols - 1; k++) {
      const c = r * cols + k;
      if (sea(c) && sea(c + 1) && sea(c + cols) && sea(c + cols + 1)) return true;
    }
  return false;
};

/** Whether a full shading obeys the rules. */
export function isValidShading(
  p: Pick<NuriPuzzle, 'rows' | 'cols' | 'numbers'>,
  sea: readonly boolean[],
) {
  const { rows, cols } = p;
  if (hasPool(rows, cols, (c) => sea[c]!)) return false;
  const seaAreas = areas(rows, cols, (c) => sea[c]!);
  if (seaAreas.length > 1) return false;
  for (const island of areas(rows, cols, (c) => !sea[c])) {
    const nums = island.filter((c) => p.numbers[c]! > 0);
    if (nums.length !== 1 || p.numbers[nums[0]!] !== island.length) return false;
  }
  return true;
}

// ---------------------------------------------------------------- techniques

export type Technique =
  'complete-island' | 'two-islands' | 'unreachable' | 'pool' | 'island-exit' | 'sea-exit';

export const TECHNIQUE_LEVEL: Record<Technique, number> = {
  'complete-island': 1,
  'two-islands': 1,
  unreachable: 1,
  pool: 2,
  'island-exit': 2,
  'sea-exit': 2,
};

export interface Step {
  technique: Technique;
  set: { cell: number; mark: 1 | 2 }[];
  /** The cells the reasoning is about. */
  cells: number[];
}

/** Island areas of land cells, with their number (0 if none yet, -1 if more than one). */
function landGroups(p: NuriPuzzle, marks: readonly Mark[]) {
  return areas(p.rows, p.cols, (c) => marks[c] === LAND).map((cells) => {
    const nums = cells.filter((c) => p.numbers[c]! > 0);
    return { cells, size: nums.length === 1 ? p.numbers[nums[0]!]! : nums.length ? -1 : 0 };
  });
}

/** Numbered cells start as land. */
export const startMarks = (p: NuriPuzzle): Mark[] => p.numbers.map((n) => (n > 0 ? LAND : UNKNOWN));

export function nextStep(p: NuriPuzzle, marks: readonly Mark[]): Step | null {
  const { rows, cols } = p;
  const groups = landGroups(p, marks);
  const groupOf = new Map<number, number>();
  groups.forEach((g, i) => g.cells.forEach((c) => groupOf.set(c, i)));
  const one = (technique: Technique, set: Step['set'], cells: number[]): Step => ({
    technique,
    set,
    cells,
  });
  // A finished island is surrounded by sea.
  for (const g of groups) {
    if (g.size <= 0 || g.cells.length !== g.size) continue;
    const around = [...new Set(g.cells.flatMap((c) => nbrs(rows, cols, c)))].filter(
      (x) => marks[x] === UNKNOWN,
    );
    if (around.length)
      return one(
        'complete-island',
        around.map((cell) => ({ cell, mark: SEA })),
        g.cells,
      );
  }
  // A cell touching two different numbered islands must be sea.
  for (let c = 0; c < marks.length; c++) {
    if (marks[c] !== UNKNOWN) continue;
    const touching = new Set(
      nbrs(rows, cols, c).flatMap((x) =>
        groupOf.has(x) && groups[groupOf.get(x)!]!.size > 0 ? [groupOf.get(x)!] : [],
      ),
    );
    if (touching.size >= 2) return one('two-islands', [{ cell: c, mark: SEA }], [c]);
  }
  // Cells no unfinished island can reach are sea.
  const reach = new Set<number>();
  for (const g of groups) {
    if (g.size <= 0) continue;
    const left = g.size - g.cells.length;
    let frontier = [...g.cells];
    const seen = new Set(g.cells);
    for (let d = 0; d < left; d++) {
      const next: number[] = [];
      for (const c of frontier)
        for (const x of nbrs(rows, cols, c)) {
          if (seen.has(x) || marks[x] === SEA) continue;
          // Do not walk next to another numbered island.
          if (
            nbrs(rows, cols, x).some(
              (y) =>
                groupOf.has(y) &&
                groupOf.get(y) !== groupOf.get(g.cells[0]!) &&
                groups[groupOf.get(y)!]!.size > 0,
            )
          )
            continue;
          seen.add(x);
          next.push(x);
        }
      frontier = next;
    }
    for (const c of seen) reach.add(c);
  }
  for (let c = 0; c < marks.length; c++)
    if (marks[c] === UNKNOWN && !reach.has(c))
      return one('unreachable', [{ cell: c, mark: SEA }], [c]);
  // Three sea cells of a 2×2 block: the fourth is land.
  for (let r = 0; r < rows - 1; r++)
    for (let k = 0; k < cols - 1; k++) {
      const block = [r * cols + k, r * cols + k + 1, (r + 1) * cols + k, (r + 1) * cols + k + 1];
      const sea = block.filter((c) => marks[c] === SEA);
      const open = block.filter((c) => marks[c] === UNKNOWN);
      if (sea.length === 3 && open.length === 1)
        return one('pool', [{ cell: open[0]!, mark: LAND }], block);
    }
  // An unfinished island with a single way out grows that way.
  for (const g of groups) {
    if (g.size <= 0 || g.cells.length >= g.size) continue;
    const exits = [...new Set(g.cells.flatMap((c) => nbrs(rows, cols, c)))].filter(
      (x) => marks[x] === UNKNOWN,
    );
    if (exits.length === 1) return one('island-exit', [{ cell: exits[0]!, mark: LAND }], g.cells);
  }
  // A sea area with a single way out (while other sea exists) grows that way.
  const seaAreas = areas(rows, cols, (c) => marks[c] === SEA);
  const seaLeft = marks.some((m) => m === UNKNOWN);
  if (seaAreas.length > 1 && seaLeft)
    for (const area of seaAreas) {
      const exits = [...new Set(area.flatMap((c) => nbrs(rows, cols, c)))].filter(
        (x) => marks[x] === UNKNOWN,
      );
      if (exits.length === 1) return one('sea-exit', [{ cell: exits[0]!, mark: SEA }], area);
    }
  return null;
}

export function logicSolve(p: NuriPuzzle) {
  const marks = startMarks(p);
  let level = 1;
  const used: Partial<Record<Technique, number>> = {};
  for (let i = 0; i < marks.length * 3; i++) {
    const step = nextStep(p, marks);
    if (!step) break;
    level = Math.max(level, TECHNIQUE_LEVEL[step.technique]);
    used[step.technique] = (used[step.technique] ?? 0) + 1;
    for (const { cell, mark } of step.set) marks[cell] = mark;
  }
  // Leftover unknowns: if the rest as land would be invalid, try them as sea (common end state).
  const solved =
    marks.every((m) => m !== UNKNOWN) &&
    isValidShading(
      p,
      marks.map((m) => m === SEA),
    );
  return { marks, level: solved ? level : 4, used, solved };
}

// ---------------------------------------------------------------- exact solver

export function countSolutions(p: NuriPuzzle, limit = 2, maxNodes = 40000) {
  const { rows, cols } = p;
  const result = { count: 0, first: null as boolean[] | null, aborted: false };
  let nodes = 0;
  const totalLand = p.numbers.reduce((a, b) => a + b, 0);
  const search = (marks: Mark[]) => {
    if (++nodes > maxNodes) {
      result.aborted = true;
      return;
    }
    // Propagate with the techniques (they are all sound).
    for (let step = nextStep(p, marks); step; step = nextStep(p, marks))
      for (const { cell, mark } of step.set) marks[cell] = mark;
    // Prune: pools, too much land, land groups with two numbers or too big.
    if (hasPool(rows, cols, (c) => marks[c] === SEA)) return;
    if (marks.filter((m) => m === LAND).length > totalLand) return;
    for (const g of landGroups(p, marks))
      if (g.size === -1 || (g.size > 0 && g.cells.length > g.size)) return;
    // Sea must stay connectable.
    const seaAreas = areas(rows, cols, (c) => marks[c] !== LAND);
    if (seaAreas.filter((a) => a.some((c) => marks[c] === SEA)).length > 1) return;
    const open = marks.indexOf(UNKNOWN);
    if (open < 0) {
      const sea = marks.map((m) => m === SEA);
      if (isValidShading(p, sea)) {
        result.count++;
        result.first ??= sea;
      }
      return;
    }
    for (const mark of [SEA, LAND] as const) {
      const next = [...marks];
      next[open] = mark;
      search(next);
      if (result.count >= limit || result.aborted) return;
    }
  };
  search(startMarks(p));
  return result;
}

// ---------------------------------------------------------------- generator

export interface NuriSpec {
  rows: number;
  cols: number;
  /** Largest island. */
  maxIsland: number;
  /** Share of cells that are land. */
  land: number;
  maxLevel: number;
}

export function generateNurikabe(spec: NuriSpec, seed: number): NuriPuzzle {
  const rng = new Rng(seed);
  const { rows, cols } = spec;
  const N = rows * cols;
  for (let attempt = 0; attempt < 1500; attempt++) {
    const owner = Array<number>(N).fill(-1);
    const islands: number[][] = [];
    const seaOk = () => areas(rows, cols, (c) => owner[c]! < 0).length <= 1;
    const free = (c: number, id: number) =>
      owner[c]! < 0 && nbrs(rows, cols, c).every((x) => owner[x]! < 0 || owner[x] === id);
    let land = 0;
    for (let tries = 0; land < N * spec.land && tries < N * 8; tries++) {
      const start = rng.int(N);
      if (!free(start, islands.length)) continue;
      const id = islands.length;
      const size = 1 + rng.int(spec.maxIsland);
      const cells = [start];
      owner[start] = id;
      if (!seaOk()) {
        owner[start] = -1;
        continue;
      }
      while (cells.length < size) {
        const options = [...new Set(cells.flatMap((c) => nbrs(rows, cols, c)))].filter((x) =>
          free(x, id),
        );
        if (!options.length) break;
        const x = options[rng.int(options.length)]!;
        owner[x] = id;
        if (seaOk()) cells.push(x);
        else owner[x] = -1;
        if (!options.length) break;
        if (cells.length < size && rng.float() < 0.05) break;
      }
      islands.push(cells);
      land += cells.length;
    }
    // Break 2×2 pools: grow a touching island into one of its cells, or start a one-cell island.
    for (let pass = 0; pass < N; pass++) {
      let pool = -1;
      for (let r = 0; r < rows - 1 && pool < 0; r++)
        for (let k = 0; k < cols - 1 && pool < 0; k++) {
          const c = r * cols + k;
          if ([c, c + 1, c + cols, c + cols + 1].every((x) => owner[x]! < 0)) pool = c;
        }
      if (pool < 0) break;
      let fixed = false;
      for (const x of rng.shuffle([pool, pool + 1, pool + cols, pool + cols + 1])) {
        const ids = [
          ...new Set(
            nbrs(rows, cols, x)
              .map((y) => owner[y]!)
              .filter((o) => o >= 0),
          ),
        ];
        if (ids.length > 1) continue;
        const id = ids.length ? ids[0]! : islands.length;
        if (ids.length && islands[id]!.length >= spec.maxIsland + 2) continue;
        owner[x] = id;
        if (!seaOk()) {
          owner[x] = -1;
          continue;
        }
        if (ids.length) islands[id]!.push(x);
        else islands.push([x]);
        fixed = true;
        break;
      }
      if (!fixed) break;
    }
    const sea = owner.map((o) => o < 0);
    if (hasPool(rows, cols, (c) => sea[c]!)) continue;
    const numbers = Array<number>(N).fill(0);
    for (const cells of islands) numbers[cells[rng.int(cells.length)]!] = cells.length;
    const p: NuriPuzzle = { rows, cols, numbers, solution: sea };
    if (!isValidShading(p, sea)) continue;
    const r = countSolutions(p, 2);
    if (r.count !== 1 || r.aborted) continue;
    if (logicSolve(p).level > spec.maxLevel) continue;
    return p;
  }
  throw new Error('No nurikabe');
}

// ---------------------------------------------------------------- play state

export const DIFFICULTIES: Record<string, NuriSpec> = {
  easy: { rows: 5, cols: 5, maxIsland: 4, land: 0.35, maxLevel: 2 },
  medium: { rows: 6, cols: 6, maxIsland: 4, land: 0.4, maxLevel: 2 },
  hard: { rows: 7, cols: 7, maxIsland: 3, land: 0.42, maxLevel: 2 },
  expert: { rows: 8, cols: 8, maxIsland: 3, land: 0.45, maxLevel: 2 },
};

interface Change {
  cells: number[];
  marks: Mark[];
}

export interface NuriState {
  difficulty: string;
  seed: number;
  puzzle: NuriPuzzle;
  marks: Mark[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newNurikabe(difficulty: string, seed: number): NuriState {
  const spec = DIFFICULTIES[difficulty];
  if (!spec) throw new Error(`Unknown difficulty ${difficulty}`);
  const puzzle = generateNurikabe(spec, seed);
  return {
    difficulty,
    seed,
    puzzle,
    marks: startMarks(puzzle),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

/** Solved when exactly the sea is shaded (dots on land are optional). */
export const isSolved = (p: NuriPuzzle, marks: readonly Mark[]) =>
  marks.every((m, c) => (m === SEA) === p.solution[c]);

export function setMarks(
  s: NuriState,
  set: readonly { cell: number; mark: Mark }[],
  options: { hint?: boolean } = {},
): NuriState {
  if (s.solved) return s;
  const changed = set.filter(({ cell, mark }) => s.marks[cell] !== mark && !s.puzzle.numbers[cell]);
  if (!changed.length) return s;
  const marks = [...s.marks];
  for (const { cell, mark } of changed) marks[cell] = mark;
  const wrong = changed.filter(
    ({ cell, mark }) => mark && (mark === SEA) !== s.puzzle.solution[cell],
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

/** Cycles a cell: undecided → sea → land (dot) → undecided. */
export const cycleMark = (m: Mark): Mark => (m === UNKNOWN ? SEA : m === SEA ? LAND : UNKNOWN);

function swap(s: NuriState, from: 'undo' | 'redo'): NuriState {
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

export const undoMove = (s: NuriState) => swap(s, 'undo');
export const redoMove = (s: NuriState) => swap(s, 'redo');

export const wrongCells = (s: NuriState) =>
  s.marks.flatMap((m, c) =>
    m && !s.puzzle.numbers[c] && (m === SEA) !== s.puzzle.solution[c] ? [c] : [],
  );

/** Rule breaks among the marks: shaded 2×2 blocks, islands with two numbers or too many cells. */
export function ruleBreaks(s: NuriState) {
  const { rows, cols } = s.puzzle;
  const pools = new Set<number>();
  for (let r = 0; r < rows - 1; r++)
    for (let k = 0; k < cols - 1; k++) {
      const block = [r * cols + k, r * cols + k + 1, (r + 1) * cols + k, (r + 1) * cols + k + 1];
      if (block.every((c) => s.marks[c] === SEA)) block.forEach((c) => pools.add(c));
    }
  const islands = new Set<number>();
  for (const g of areas(rows, cols, (c) => s.marks[c] === LAND)) {
    const nums = g.filter((c) => s.puzzle.numbers[c]! > 0);
    if (nums.length > 1 || (nums.length === 1 && g.length > s.puzzle.numbers[nums[0]!]!))
      g.forEach((c) => islands.add(c));
  }
  return { pools, islands };
}

const intArray = (a: unknown, len: number, max: number) =>
  Array.isArray(a) && a.length === len && a.every((x) => Number.isInteger(x) && x >= 0 && x <= max);

/** A saved game is valid when its puzzle is exactly the one its seed generates. */
export function isValidNuriState(data: unknown): data is NuriState {
  if (!isRecord(data)) return false;
  const d = data as unknown as NuriState;
  if (typeof d.difficulty !== 'string' || !(d.difficulty in DIFFICULTIES)) return false;
  if (!Number.isInteger(d.seed) || !Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || !Number.isInteger(d.hints) || typeof d.solved !== 'boolean')
    return false;
  if (!Array.isArray(d.undo) || !Array.isArray(d.redo)) return false;
  const fresh = newNurikabe(d.difficulty, d.seed).puzzle;
  if (JSON.stringify(fresh) !== JSON.stringify(d.puzzle)) return false;
  const len = fresh.numbers.length;
  if (!intArray(d.marks, len, 2)) return false;
  if (fresh.numbers.some((n, c) => n && d.marks[c] !== LAND)) return false;
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
