/**
 * Minesweeper, shared by Classic (#116) and No-Guess (#117). Mines are placed after the first
 * reveal — never on that cell or its neighbours — from the game's seed and the first cell, so a
 * game replays exactly. In no-guess games the placement is redrawn until the deduction solver can
 * clear the board from the first cell without guessing.
 */
import { Rng } from '../../../core/game-engine/random';
import { isRecord } from '../../../core/persistence/versioned';

export interface MinesSpec {
  rows: number;
  cols: number;
  mines: number;
}

export type Status = 'ready' | 'playing' | 'won' | 'lost';

export interface MinesState {
  difficulty: string;
  seed: number;
  rows: number;
  cols: number;
  mineCount: number;
  noGuess: boolean;
  /** The first revealed cell (mines are placed from it), or -1. */
  first: number;
  /** Mine layout, empty until the first reveal. */
  mines: boolean[];
  revealed: boolean[];
  flags: boolean[];
  status: Status;
  /** The mine that went off. */
  exploded: number;
  /** Reveals and chords made, and hints taken. */
  moves: number;
  hints: number;
  elapsedMs: number;
}

export const neighbours = (rows: number, cols: number, c: number) => {
  const r = Math.floor(c / cols);
  const k = c % cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dk = -1; dk <= 1; dk++) {
      if (!dr && !dk) continue;
      const rr = r + dr;
      const kk = k + dk;
      if (rr >= 0 && kk >= 0 && rr < rows && kk < cols) out.push(rr * cols + kk);
    }
  return out;
};

export const countAround = (s: Pick<MinesState, 'rows' | 'cols' | 'mines'>, c: number) =>
  neighbours(s.rows, s.cols, c).filter((x) => s.mines[x]).length;

export function newMines(
  difficulty: string,
  spec: MinesSpec,
  seed: number,
  noGuess: boolean,
): MinesState {
  const n = spec.rows * spec.cols;
  return {
    difficulty,
    seed,
    rows: spec.rows,
    cols: spec.cols,
    mineCount: spec.mines,
    noGuess,
    first: -1,
    mines: [],
    revealed: Array<boolean>(n).fill(false),
    flags: Array<boolean>(n).fill(false),
    status: 'ready',
    exploded: -1,
    moves: 0,
    hints: 0,
    elapsedMs: 0,
  };
}

/** A random layout avoiding the first cell and its neighbours (when there is room). */
function drawLayout(rows: number, cols: number, mines: number, first: number, rng: Rng): boolean[] {
  const n = rows * cols;
  const keep = new Set([first, ...neighbours(rows, cols, first)]);
  let pool = Array.from({ length: n }, (_, c) => c).filter((c) => !keep.has(c));
  if (pool.length < mines) pool = Array.from({ length: n }, (_, c) => c).filter((c) => c !== first);
  const layout = Array<boolean>(n).fill(false);
  for (const c of rng.shuffle(pool).slice(0, mines)) layout[c] = true;
  return layout;
}

/** The layout for a game: deterministic from its seed and first cell. */
export function layoutFor(
  s: Pick<MinesState, 'rows' | 'cols' | 'mineCount' | 'seed' | 'noGuess'>,
  first: number,
): boolean[] {
  const rng = new Rng((s.seed ^ Math.imul(first + 1, 0x9e3779b1)) >>> 0);
  if (!s.noGuess) return drawLayout(s.rows, s.cols, s.mineCount, first, rng);
  for (let attempt = 0; attempt < 3000; attempt++) {
    const layout = drawLayout(s.rows, s.cols, s.mineCount, first, rng);
    if (solvableWithoutGuessing(s.rows, s.cols, s.mineCount, layout, first)) return layout;
  }
  // Extremely unlikely: fall back to a plain layout (still safe at the first cell).
  return drawLayout(s.rows, s.cols, s.mineCount, first, rng);
}

/** Opens a cell (and the blank area around it). */
function open(s: MinesState, revealed: boolean[], c: number) {
  const stack = [c];
  while (stack.length) {
    const x = stack.pop()!;
    if (revealed[x] || s.flags[x]) continue;
    revealed[x] = true;
    if (!s.mines[x] && countAround(s, x) === 0)
      for (const y of neighbours(s.rows, s.cols, x)) if (!revealed[y]) stack.push(y);
  }
}

function settle(s: MinesState, revealed: boolean[], hit: number): MinesState {
  if (hit >= 0)
    return {
      ...s,
      revealed: revealed.map((r, c) => r || s.mines[c]!),
      status: 'lost',
      exploded: hit,
    };
  const won = revealed.every((r, c) => r || s.mines[c]);
  return {
    ...s,
    revealed,
    status: won ? 'won' : 'playing',
    flags: won ? s.mines.map(Boolean) : s.flags,
  };
}

export function reveal(s: MinesState, c: number): MinesState {
  if (s.status === 'won' || s.status === 'lost' || s.revealed[c] || s.flags[c]) return s;
  let state = s;
  if (s.status === 'ready') state = { ...s, first: c, mines: layoutFor(s, c), status: 'playing' };
  const revealed = [...state.revealed];
  if (state.mines[c]) return settle({ ...state, moves: state.moves + 1 }, revealed, c);
  open(state, revealed, c);
  return settle({ ...state, moves: state.moves + 1 }, revealed, -1);
}

/** On an open number with as many flags around: open the rest of its neighbours. */
export function chord(s: MinesState, c: number): MinesState {
  if (s.status !== 'playing' || !s.revealed[c]) return s;
  const around = neighbours(s.rows, s.cols, c);
  const flagged = around.filter((x) => s.flags[x]).length;
  if (flagged !== countAround(s, c)) return s;
  const closed = around.filter((x) => !s.revealed[x] && !s.flags[x]);
  if (!closed.length) return s;
  const revealed = [...s.revealed];
  const hit = closed.find((x) => s.mines[x]);
  for (const x of closed) if (!s.mines[x]) open(s, revealed, x);
  return settle({ ...s, moves: s.moves + 1 }, revealed, hit ?? -1);
}

export function toggleFlag(s: MinesState, c: number): MinesState {
  if (s.status === 'won' || s.status === 'lost' || s.revealed[c]) return s;
  const flags = [...s.flags];
  flags[c] = !flags[c];
  return { ...s, flags };
}

export const flagsLeft = (s: MinesState) => s.mineCount - s.flags.filter(Boolean).length;

// ---------------------------------------------------------------- deductions

export type Technique = 'single' | 'subset' | 'count';
export const TECHNIQUE_LEVEL: Record<Technique, number> = { single: 1, subset: 2, count: 3 };

export interface Deduction {
  technique: Technique;
  safe: number[];
  mines: number[];
  /** The numbers the reasoning uses. */
  from: number[];
}

/**
 * The easiest deduction from what is visible: open numbers, and cells known to be mines (not the
 * player's flags, which may be wrong).
 */
export function deduce(
  rows: number,
  cols: number,
  mineCount: number,
  revealed: readonly boolean[],
  numberAt: (c: number) => number,
  known: ReadonlySet<number>,
): Deduction | null {
  const constraints: { at: number; cells: number[]; need: number }[] = [];
  for (let c = 0; c < revealed.length; c++) {
    if (!revealed[c]) continue;
    const around = neighbours(rows, cols, c);
    const cells = around.filter((x) => !revealed[x] && !known.has(x));
    if (!cells.length) continue;
    const need = numberAt(c) - around.filter((x) => known.has(x)).length;
    constraints.push({ at: c, cells, need });
    if (need === 0) return { technique: 'single', safe: cells, mines: [], from: [c] };
    if (need === cells.length) return { technique: 'single', safe: [], mines: cells, from: [c] };
  }
  for (const a of constraints)
    for (const b of constraints) {
      if (a === b || a.cells.length >= b.cells.length) continue;
      if (!a.cells.every((x) => b.cells.includes(x))) continue;
      const rest = b.cells.filter((x) => !a.cells.includes(x));
      const need = b.need - a.need;
      if (need === 0) return { technique: 'subset', safe: rest, mines: [], from: [a.at, b.at] };
      if (need === rest.length)
        return { technique: 'subset', safe: [], mines: rest, from: [a.at, b.at] };
    }
  const unknown = revealed.flatMap((r, c) => (r || known.has(c) ? [] : [c]));
  const left = mineCount - known.size;
  if (unknown.length && left === 0)
    return { technique: 'count', safe: unknown, mines: [], from: [] };
  if (unknown.length && left === unknown.length)
    return { technique: 'count', safe: [], mines: unknown, from: [] };
  return null;
}

/** Whether deductions alone clear the board from the first cell. */
export function solvableWithoutGuessing(
  rows: number,
  cols: number,
  mineCount: number,
  layout: readonly boolean[],
  first: number,
): boolean {
  const probe = {
    rows,
    cols,
    mines: layout as boolean[],
    flags: Array<boolean>(layout.length).fill(false),
  } as MinesState;
  const revealed = Array<boolean>(layout.length).fill(false);
  open(probe, revealed, first);
  const known = new Set<number>();
  const numberAt = (c: number) => countAround(probe, c);
  for (let i = 0; i < layout.length * 2; i++) {
    if (revealed.every((r, c) => r || layout[c])) return true;
    const d = deduce(rows, cols, mineCount, revealed, numberAt, known);
    if (!d) return false;
    for (const m of d.mines) known.add(m);
    for (const x of d.safe) open(probe, revealed, x);
  }
  return false;
}

/** The deduction for the player's current view, or null when a guess is needed. */
export function hintFor(s: MinesState): Deduction | null {
  if (s.status !== 'playing') return null;
  // Mines the player has not flagged are still unknown to them; flags are not trusted.
  const known = new Set<number>();
  for (let i = 0; i < s.revealed.length; i++) {
    const d = deduce(s.rows, s.cols, s.mineCount, s.revealed, (c) => countAround(s, c), known);
    if (!d) return null;
    if (d.safe.length) return d;
    for (const m of d.mines) known.add(m);
    // Mines alone are progress too, if the player has not flagged them.
    if (d.mines.some((m) => !s.flags[m])) return d;
  }
  return null;
}

/** Rough mine risk of each closed cell (worst local constraint, else the global density). */
export function risks(s: MinesState): number[] {
  const closed = s.revealed.map((r) => !r);
  const left = Math.max(0, s.mineCount);
  const unknown = closed.filter(Boolean).length;
  const base = unknown ? left / unknown : 0;
  const risk = s.revealed.map((r) => (r ? 1 : base));
  s.revealed.forEach((r, c) => {
    if (!r) return;
    const cells = neighbours(s.rows, s.cols, c).filter((x) => !s.revealed[x]);
    if (!cells.length) return;
    const p = countAround(s, c) / cells.length;
    for (const x of cells) risk[x] = Math.max(risk[x] === base ? 0 : risk[x]!, p);
  });
  return risk;
}

const boolArray = (a: unknown, n: number) =>
  Array.isArray(a) && a.length === n && a.every((x) => typeof x === 'boolean');

/** A saved game is valid when its mines are exactly the layout its seed and first cell give. */
export function isValidMinesState(
  data: unknown,
  specs: Record<string, MinesSpec>,
  noGuess: boolean,
): data is MinesState {
  if (!isRecord(data)) return false;
  const d = data as unknown as MinesState;
  const spec = specs[d.difficulty];
  if (!spec || d.rows !== spec.rows || d.cols !== spec.cols || d.mineCount !== spec.mines)
    return false;
  if (d.noGuess !== noGuess || !Number.isInteger(d.seed) || !Number.isInteger(d.first))
    return false;
  if (!['ready', 'playing', 'won', 'lost'].includes(d.status)) return false;
  if (
    !Number.isFinite(d.elapsedMs) ||
    d.elapsedMs < 0 ||
    !Number.isInteger(d.moves) ||
    !Number.isInteger(d.hints)
  )
    return false;
  const n = spec.rows * spec.cols;
  if (!boolArray(d.revealed, n) || !boolArray(d.flags, n)) return false;
  if (d.status === 'ready')
    return d.first === -1 && d.mines.length === 0 && !d.revealed.some(Boolean);
  if (d.first < 0 || d.first >= n || !boolArray(d.mines, n)) return false;
  const layout = layoutFor(d, d.first);
  if (layout.some((m, c) => m !== d.mines[c])) return false;
  if (d.status === 'playing' && d.revealed.some((r, c) => r && d.mines[c])) return false;
  return d.revealed[d.first] === true;
}
