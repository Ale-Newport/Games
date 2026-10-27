/**
 * Slitherlink (#113): draw one closed loop along the grid lines, never crossing or touching itself,
 * so that every number tells how many of its cell's four sides the loop uses.
 *
 * Puzzles are generated from a seed: a random region of cells grown without holes or pinch points
 * (its boundary is the loop), every cell numbered, then numbers removed while the exact solver
 * still finds one loop and the technique solver can still draw it.
 */
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const UNKNOWN = 0;
export const LINE = 1;
export const CROSS = 2;
export type Edge = 0 | 1 | 2;

export interface Geometry {
  rows: number;
  cols: number;
  /** Horizontal edges first ((rows+1) × cols), then vertical (rows × (cols+1)). */
  edges: number;
  /** The four edges of each cell: top, bottom, left, right. */
  cellEdges: number[][];
  /** The edges at each vertex ((rows+1) × (cols+1)). */
  vertexEdges: number[][];
  /** The two vertices of each edge. */
  edgeVertices: [number, number][];
}

const geoCache = new Map<string, Geometry>();

export function geometry(rows: number, cols: number): Geometry {
  const key = `${rows}x${cols}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const H = (rows + 1) * cols;
  const h = (r: number, c: number) => r * cols + c;
  const v = (r: number, c: number) => H + r * (cols + 1) + c;
  const edges = H + rows * (cols + 1);
  const cellEdges = Array.from({ length: rows * cols }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return [h(r, c), h(r + 1, c), v(r, c), v(r, c + 1)];
  });
  const vx = (r: number, c: number) => r * (cols + 1) + c;
  const vertexEdges = Array.from({ length: (rows + 1) * (cols + 1) }, () => [] as number[]);
  const edgeVertices: [number, number][] = [];
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c < cols; c++) {
      const e = h(r, c);
      edgeVertices[e] = [vx(r, c), vx(r, c + 1)];
    }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c <= cols; c++) {
      const e = v(r, c);
      edgeVertices[e] = [vx(r, c), vx(r + 1, c)];
    }
  edgeVertices.forEach(([a, b], e) => {
    vertexEdges[a]!.push(e);
    vertexEdges[b]!.push(e);
  });
  const geo = { rows, cols, edges, cellEdges, vertexEdges, edgeVertices };
  geoCache.set(key, geo);
  return geo;
}

/** Whether the line edges form exactly one closed loop. */
export function isSingleLoop(geo: Geometry, lines: readonly boolean[]): boolean {
  const on = lines.flatMap((x, e) => (x ? [e] : []));
  if (!on.length) return false;
  for (const vEdges of geo.vertexEdges) {
    const d = vEdges.filter((e) => lines[e]).length;
    if (d !== 0 && d !== 2) return false;
  }
  // Walk the loop from the first edge.
  const seen = new Set<number>([on[0]!]);
  const stack = [on[0]!];
  while (stack.length) {
    const e = stack.pop()!;
    for (const vtx of geo.edgeVertices[e]!)
      for (const f of geo.vertexEdges[vtx]!)
        if (lines[f] && !seen.has(f)) {
          seen.add(f);
          stack.push(f);
        }
  }
  return seen.size === on.length;
}

// ---------------------------------------------------------------- deductions

export type Technique = 'cell-count' | 'vertex' | 'loop';
export const TECHNIQUE_LEVEL: Record<Technique, number> = { 'cell-count': 1, vertex: 1, loop: 2 };

export interface Step {
  technique: Technique;
  set: { edge: number; value: 1 | 2 }[];
  /** The cell or vertex the reasoning is about (cell index, or vertex index for 'vertex'). */
  at: number;
}

/** Endpoints of the line paths, by union-find over line edges. */
function components(geo: Geometry, edges: readonly Edge[]) {
  const parent = Array.from({ length: geo.vertexEdges.length }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]!)));
  edges.forEach((s, e) => {
    if (s === LINE) {
      const [a, b] = geo.edgeVertices[e]!;
      parent[find(a)] = find(b);
    }
  });
  return find;
}

/**
 * The easiest deduction: a cell whose number is met (or needs every open side), a vertex whose
 * two lines are drawn (or that must continue/stop), or an edge that would close a loop too early.
 */
export function nextStep(
  geo: Geometry,
  clues: readonly (number | null)[],
  edges: readonly Edge[],
): Step | null {
  for (let i = 0; i < clues.length; i++) {
    const n = clues[i];
    if (n === null || n === undefined) continue;
    const es = geo.cellEdges[i]!;
    const lines = es.filter((e) => edges[e] === LINE).length;
    const open = es.filter((e) => edges[e] === UNKNOWN);
    if (!open.length) continue;
    if (lines === n)
      return { technique: 'cell-count', at: i, set: open.map((edge) => ({ edge, value: CROSS })) };
    if (lines + open.length === n)
      return { technique: 'cell-count', at: i, set: open.map((edge) => ({ edge, value: LINE })) };
  }
  for (let vtx = 0; vtx < geo.vertexEdges.length; vtx++) {
    const es = geo.vertexEdges[vtx]!;
    const lines = es.filter((e) => edges[e] === LINE).length;
    const open = es.filter((e) => edges[e] === UNKNOWN);
    if (!open.length) continue;
    if (lines === 2 || (lines === 0 && open.length === 1))
      return { technique: 'vertex', at: vtx, set: open.map((edge) => ({ edge, value: CROSS })) };
    if (lines === 1 && open.length === 1)
      return { technique: 'vertex', at: vtx, set: [{ edge: open[0]!, value: LINE }] };
  }
  // An edge joining the two ends of one path closes a loop: only allowed as the very last line.
  const find = components(geo, edges);
  const totalLines = edges.filter((s) => s === LINE).length;
  for (let e = 0; e < geo.edges; e++) {
    if (edges[e] !== UNKNOWN) continue;
    const [a, b] = geo.edgeVertices[e]!;
    if (find(a) !== find(b)) continue;
    const comp = find(a);
    const inComp = edges.filter(
      (s, f) => s === LINE && find(geo.edgeVertices[f]![0]) === comp,
    ).length;
    // Closing here leaves other lines outside the loop, or numbers unmet: a cross.
    const trial = [...edges];
    trial[e] = LINE;
    const unmet = clues.some(
      (n, i) => n !== null && geo.cellEdges[i]!.filter((f) => trial[f] === LINE).length !== n,
    );
    if (inComp < totalLines || unmet)
      return { technique: 'loop', at: e, set: [{ edge: e, value: CROSS }] };
  }
  return null;
}

export function logicSolve(geo: Geometry, clues: readonly (number | null)[]) {
  const edges: Edge[] = Array(geo.edges).fill(UNKNOWN);
  let level = 1;
  const used: Partial<Record<Technique, number>> = {};
  for (let i = 0; i < geo.edges * 3; i++) {
    const step = nextStep(geo, clues, edges);
    if (!step) break;
    level = Math.max(level, TECHNIQUE_LEVEL[step.technique]);
    used[step.technique] = (used[step.technique] ?? 0) + 1;
    for (const { edge, value } of step.set) edges[edge] = value;
  }
  const solved =
    edges.every((s) => s !== UNKNOWN) &&
    isSingleLoop(
      geo,
      edges.map((s) => s === LINE),
    );
  return { edges, level: solved ? level : 4, used, solved };
}

// ---------------------------------------------------------------- exact solver

/** Counts loops satisfying the numbers (stops at `limit`), with a node budget. */
export function countSolutions(
  geo: Geometry,
  clues: readonly (number | null)[],
  limit = 2,
  maxNodes = 20000,
): { count: number; first: boolean[] | null; aborted: boolean } {
  const result = { count: 0, first: null as boolean[] | null, aborted: false };
  let nodes = 0;
  const propagate = (edges: Edge[]): boolean => {
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i < clues.length; i++) {
        const n = clues[i];
        if (n === null || n === undefined) continue;
        const es = geo.cellEdges[i]!;
        const lines = es.filter((e) => edges[e] === LINE).length;
        const open = es.filter((e) => edges[e] === UNKNOWN);
        if (lines > n || lines + open.length < n) return false;
        if (open.length && (lines === n || lines + open.length === n)) {
          for (const e of open) edges[e] = lines === n ? CROSS : LINE;
          changed = true;
        }
      }
      for (const es of geo.vertexEdges) {
        const lines = es.filter((e) => edges[e] === LINE).length;
        const open = es.filter((e) => edges[e] === UNKNOWN);
        if (lines > 2 || (lines === 1 && !open.length)) return false;
        if (!open.length) continue;
        if (lines === 2 || (lines === 0 && open.length === 1)) {
          for (const e of open) edges[e] = CROSS;
          changed = true;
        } else if (lines === 1 && open.length === 1) {
          edges[open[0]!] = LINE;
          changed = true;
        }
      }
    }
    // A closed loop must be the whole answer.
    const find = components(geo, edges);
    const lines = edges.flatMap((s, e) => (s === LINE ? [e] : []));
    if (!lines.length) return true;
    const degrees = geo.vertexEdges.map((es) => es.filter((e) => edges[e] === LINE).length);
    const comps = new Map<number, { edges: number; ends: number }>();
    for (const e of lines) {
      const c = find(geo.edgeVertices[e]![0]);
      const x = comps.get(c) ?? { edges: 0, ends: 0 };
      x.edges++;
      comps.set(c, x);
    }
    degrees.forEach((d, vtx) => {
      if (d === 1) comps.get(find(vtx))!.ends++;
    });
    for (const x of comps.values()) if (x.ends === 0 && comps.size > 1) return false;
    return true;
  };
  const search = (edges: Edge[]) => {
    if (++nodes > maxNodes) {
      result.aborted = true;
      return;
    }
    if (!propagate(edges)) return;
    let e = -1;
    // Prefer extending a path end.
    for (let vtx = 0; vtx < geo.vertexEdges.length && e < 0; vtx++) {
      const es = geo.vertexEdges[vtx]!;
      if (es.filter((f) => edges[f] === LINE).length === 1)
        e = es.find((f) => edges[f] === UNKNOWN) ?? -1;
    }
    if (e < 0) e = edges.indexOf(UNKNOWN);
    if (e < 0) {
      const lines = edges.map((s) => s === LINE);
      if (
        isSingleLoop(geo, lines) &&
        clues.every((n, i) => n === null || geo.cellEdges[i]!.filter((f) => lines[f]).length === n)
      ) {
        result.count++;
        result.first ??= lines;
      }
      return;
    }
    for (const value of [LINE, CROSS] as const) {
      const next = [...edges];
      next[e] = value;
      search(next);
      if (result.count >= limit || result.aborted) return;
    }
  };
  search(Array(geo.edges).fill(UNKNOWN));
  return result;
}

// ---------------------------------------------------------------- generator

export interface SlitherSpec {
  rows: number;
  cols: number;
  /** Share of cells inside the loop. */
  fill: number;
  maxLevel: number;
}

/** A random region without holes or pinch points; its boundary is the loop. */
function randomRegion(spec: SlitherSpec, rng: Rng): boolean[] | null {
  const { rows, cols } = spec;
  const inside = Array<boolean>(rows * cols).fill(false);
  const at = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < rows && c < cols && inside[r * cols + c]!;
  const nb = (i: number) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return [
      r > 0 ? i - cols : -1,
      r < rows - 1 ? i + cols : -1,
      c > 0 ? i - 1 : -1,
      c < cols - 1 ? i + 1 : -1,
    ].filter((x) => x >= 0);
  };
  // Outside cells must all reach the border (no holes).
  const noHoles = () => {
    const seen = new Set<number>();
    const stack: number[] = [];
    for (let i = 0; i < inside.length; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      if (!inside[i] && (r === 0 || c === 0 || r === rows - 1 || c === cols - 1)) {
        seen.add(i);
        stack.push(i);
      }
    }
    while (stack.length) {
      const i = stack.pop()!;
      for (const x of nb(i))
        if (!inside[x] && !seen.has(x)) {
          seen.add(x);
          stack.push(x);
        }
    }
    return seen.size === inside.filter((x) => !x).length;
  };
  // No two cells of one side touching only at a corner (that would pinch the loop).
  const noPinch = (i: number) => {
    const r0 = Math.floor(i / cols);
    const c0 = i % cols;
    for (let r = r0 - 1; r <= r0; r++)
      for (let c = c0 - 1; c <= c0; c++) {
        const a = at(r, c);
        const b = at(r, c + 1);
        const d = at(r + 1, c);
        const e = at(r + 1, c + 1);
        if ((a && e && !b && !d) || (b && d && !a && !e)) return false;
      }
    return true;
  };
  const start = rng.int(rows * cols);
  inside[start] = true;
  let count = 1;
  const target = Math.round(rows * cols * spec.fill);
  for (let tries = 0; count < target && tries < rows * cols * 40; tries++) {
    const frontier = inside.flatMap((x, i) => (x ? nb(i).filter((y) => !inside[y]) : []));
    if (!frontier.length) break;
    const pick = frontier[rng.int(frontier.length)]!;
    inside[pick] = true;
    if (noPinch(pick) && noHoles()) count++;
    else inside[pick] = false;
  }
  return count >= target * 0.8 ? inside : null;
}

export interface SlitherPuzzle {
  rows: number;
  cols: number;
  clues: (number | null)[];
  /** The loop's edges. */
  solution: boolean[];
}

export function loopOf(geo: Geometry, inside: readonly boolean[]): boolean[] {
  const lines = Array<boolean>(geo.edges).fill(false);
  inside.forEach((x, i) => {
    if (!x) return;
    const r = Math.floor(i / geo.cols);
    const c = i % geo.cols;
    const out = [
      r > 0 ? !inside[i - geo.cols] : true,
      r < geo.rows - 1 ? !inside[i + geo.cols] : true,
      c > 0 ? !inside[i - 1] : true,
      c < geo.cols - 1 ? !inside[i + 1] : true,
    ];
    geo.cellEdges[i]!.forEach((e, k) => {
      if (out[k]) lines[e] = true;
    });
  });
  return lines;
}

export function generateSlither(spec: SlitherSpec, seed: number): SlitherPuzzle {
  const rng = new Rng(seed);
  const geo = geometry(spec.rows, spec.cols);
  for (let attempt = 0; attempt < 100; attempt++) {
    const region = randomRegion(spec, rng);
    if (!region) continue;
    const solution = loopOf(geo, region);
    if (!isSingleLoop(geo, solution)) continue;
    const clues: (number | null)[] = geo.cellEdges.map(
      (es) => es.filter((e) => solution[e]).length,
    );
    // Even with every number shown, the techniques must manage it.
    if (logicSolve(geo, clues).level > spec.maxLevel) continue;
    for (const i of rng.shuffle(clues.map((_, i) => i))) {
      const keep = clues[i]!;
      clues[i] = null;
      const r = countSolutions(geo, clues, 2);
      if (r.count !== 1 || r.aborted || logicSolve(geo, clues).level > spec.maxLevel)
        clues[i] = keep;
    }
    return { rows: spec.rows, cols: spec.cols, clues, solution };
  }
  throw new Error('No slitherlink');
}

// ---------------------------------------------------------------- play state

export const DIFFICULTIES: Record<string, SlitherSpec> = {
  easy: { rows: 5, cols: 5, fill: 0.5, maxLevel: 2 },
  medium: { rows: 7, cols: 7, fill: 0.5, maxLevel: 2 },
  hard: { rows: 10, cols: 10, fill: 0.5, maxLevel: 2 },
  expert: { rows: 12, cols: 12, fill: 0.5, maxLevel: 2 },
};

interface Change {
  edges: number[];
  before: Edge[];
}

export interface SlitherState {
  difficulty: string;
  seed: number;
  puzzle: SlitherPuzzle;
  edges: Edge[];
  undo: Change[];
  redo: Change[];
  mistakes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newSlither(difficulty: string, seed: number): SlitherState {
  const spec = DIFFICULTIES[difficulty];
  if (!spec) throw new Error(`Unknown difficulty ${difficulty}`);
  const puzzle = generateSlither(spec, seed);
  return {
    difficulty,
    seed,
    puzzle,
    edges: puzzle.solution.map(() => UNKNOWN),
    undo: [],
    redo: [],
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

/** Solved when exactly the loop's edges are drawn (crosses are only notes). */
export const isSolved = (p: SlitherPuzzle, edges: readonly Edge[]) =>
  edges.every((s, e) => (s === LINE) === p.solution[e]);

export function setEdges(
  s: SlitherState,
  set: readonly { edge: number; value: Edge }[],
  options: { hint?: boolean } = {},
): SlitherState {
  if (s.solved) return s;
  const changed = set.filter(({ edge, value }) => s.edges[edge] !== value);
  if (!changed.length) return s;
  const edges = [...s.edges];
  for (const { edge, value } of changed) edges[edge] = value;
  const wrong = changed.filter(
    ({ edge, value }) =>
      (value === LINE && !s.puzzle.solution[edge]) || (value === CROSS && s.puzzle.solution[edge]),
  ).length;
  return {
    ...s,
    edges,
    undo: [
      ...s.undo,
      { edges: changed.map((x) => x.edge), before: changed.map((x) => s.edges[x.edge]!) },
    ].slice(-500),
    redo: [],
    mistakes: s.mistakes + wrong,
    hints: s.hints + (options.hint ? 1 : 0),
    solved: isSolved(s.puzzle, edges),
  };
}

/** Cycles an edge: empty → line → cross → empty. */
export const cycleEdge = (e: Edge): Edge => (e === UNKNOWN ? LINE : e === LINE ? CROSS : UNKNOWN);

function swap(s: SlitherState, from: 'undo' | 'redo'): SlitherState {
  const last = s[from].at(-1);
  if (!last || s.solved) return s;
  const edges = [...s.edges];
  const back: Change = { edges: last.edges, before: last.edges.map((e) => edges[e]!) };
  last.edges.forEach((e, i) => (edges[e] = last.before[i]!));
  const to = from === 'undo' ? 'redo' : 'undo';
  return {
    ...s,
    edges,
    [from]: s[from].slice(0, -1),
    [to]: [...s[to], back],
    solved: isSolved(s.puzzle, edges),
  };
}

export const undoMove = (s: SlitherState) => swap(s, 'undo');
export const redoMove = (s: SlitherState) => swap(s, 'redo');

export const wrongEdges = (s: SlitherState) =>
  s.edges.flatMap((v, e) =>
    (v === LINE && !s.puzzle.solution[e]) || (v === CROSS && s.puzzle.solution[e]) ? [e] : [],
  );

/** Numbers already exceeded (or unreachable), and vertices with three or four lines. */
export function ruleBreaks(s: SlitherState) {
  const geo = geometry(s.puzzle.rows, s.puzzle.cols);
  const cells = new Set<number>();
  s.puzzle.clues.forEach((n, i) => {
    if (n === null) return;
    const es = geo.cellEdges[i]!;
    const lines = es.filter((e) => s.edges[e] === LINE).length;
    const open = es.filter((e) => s.edges[e] === UNKNOWN).length;
    if (lines > n || lines + open < n) cells.add(i);
  });
  const vertices = new Set<number>();
  geo.vertexEdges.forEach((es, v) => {
    if (es.filter((e) => s.edges[e] === LINE).length > 2) vertices.add(v);
  });
  return { cells, vertices };
}

const intArray = (a: unknown, len: number, max: number) =>
  Array.isArray(a) && a.length === len && a.every((x) => Number.isInteger(x) && x >= 0 && x <= max);

/** A saved game is valid when its puzzle is exactly the one its seed generates. */
export function isValidSlitherState(data: unknown): data is SlitherState {
  if (!isRecord(data)) return false;
  const d = data as unknown as SlitherState;
  if (typeof d.difficulty !== 'string' || !(d.difficulty in DIFFICULTIES)) return false;
  if (!Number.isInteger(d.seed) || !Number.isFinite(d.elapsedMs) || d.elapsedMs < 0) return false;
  if (!Number.isInteger(d.mistakes) || !Number.isInteger(d.hints) || typeof d.solved !== 'boolean')
    return false;
  if (!Array.isArray(d.undo) || !Array.isArray(d.redo)) return false;
  const fresh = newSlither(d.difficulty, d.seed).puzzle;
  if (JSON.stringify(fresh) !== JSON.stringify(d.puzzle)) return false;
  const len = fresh.solution.length;
  if (!intArray(d.edges, len, 2)) return false;
  const ok = (list: unknown[]) =>
    list.every(
      (ch) =>
        isRecord(ch) &&
        Array.isArray(ch.edges) &&
        ch.edges.every((e) => Number.isInteger(e) && (e as number) >= 0 && (e as number) < len) &&
        intArray(ch.before, ch.edges.length, 2),
    );
  return ok(d.undo) && ok(d.redo) && d.solved === isSolved(fresh, d.edges);
}
