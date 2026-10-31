/**
 * Colour Rows, a roll-and-cross dice game for 1–4 players. Each sheet has four rows: red and
 * yellow run 2→12, green and blue 12→2. Six dice are thrown — two white and one per colour. Every
 * player may cross the sum of the two white dice in any row; the player who threw may then also
 * cross a white die plus a coloured die in that colour's row. Numbers are crossed left to right:
 * any numbers skipped are lost. The last number of a row may be crossed only after five crosses in
 * that row, and doing so locks the row (the lock counts as one more cross) and removes its die. The
 * thrower takes a penalty (−5) when they cross nothing. The game ends when a player has four
 * penalties or two rows are locked. A row with n crosses scores n(n+1)/2.
 *
 * Decisions are taken one at a time: after a throw the thrower and then the others, in seat order,
 * use the white sum or pass; then the thrower uses a colour combination or passes. Rows locked
 * during a step can still be crossed by the others in that same step (the locks apply once it
 * ends). Dice come from a generator stored in the state.
 *
 * Actions: "roll", "pass", "mark:<row>:<number>" (row 0 red, 1 yellow, 2 green, 3 blue).
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export const ROWS = 4;
export const CELLS = 11;
export const MAX_PENALTIES = 4;
export const LOCKS_TO_END = 2;
export const MARKS_TO_LOCK = 5;

/** The number at a position of a row: red and yellow rise, green and blue fall. */
export const numberAt = (row: number, pos: number) => (row < 2 ? pos + 2 : 12 - pos);
export const posOf = (row: number, n: number) => (row < 2 ? n - 2 : 12 - n);

export interface Sheet {
  /** Crossed positions per row, in increasing order. */
  marks: number[][];
  /** Rows this player locked (the lock counts as a cross). */
  locks: boolean[];
  penalties: number;
}

export interface Dice {
  white: [number, number];
  /** Coloured dice by row (null once the row is locked). */
  colour: (number | null)[];
}

export interface RowsGame {
  seed: number;
  rng: RngState;
  players: number;
  sheets: Sheet[];
  locked: boolean[];
  /** The thrower. */
  active: number;
  dice: Dice | null;
  phase: 'roll' | 'white' | 'colour' | 'over';
  /** Players still to decide on the white sum, the first one deciding now. */
  queue: number[];
  /** Whether the thrower crossed anything with this throw. */
  activeMarked: boolean;
  /** Rows locked during the current step (applied when it ends). */
  pending: number[];
  /** Rows locked so far with this throw. */
  newLocks: number[];
  /** What happened at the end of the last throw: a penalty, rows locked. */
  event: { penalty: number | null; locked: number[] } | null;
  history: string[];
}

const emptySheet = (): Sheet => ({
  marks: [[], [], [], []],
  locks: [false, false, false, false],
  penalties: 0,
});

export function newRows(players: number, seed: number): RowsGame {
  return {
    seed: seed >>> 0,
    rng: seedRng(seed >>> 0),
    players,
    sheets: Array.from({ length: players }, emptySheet),
    locked: [false, false, false, false],
    active: 0,
    dice: null,
    phase: 'roll',
    queue: [],
    activeMarked: false,
    pending: [],
    newLocks: [],
    event: null,
    history: [],
  };
}

/** The seat that decides now. */
export const decider = (g: RowsGame) => (g.phase === 'white' ? g.queue[0]! : g.active);

export const whiteSum = (d: Dice) => d.white[0] + d.white[1];

/** Whether a number can be crossed in a row of a sheet now. */
export function canMark(g: RowsGame, sheet: Sheet, row: number, n: number): boolean {
  if (g.locked[row]) return false;
  const pos = posOf(row, n);
  if (pos < 0 || pos >= CELLS) return false;
  const marks = sheet.marks[row]!;
  const last = marks.length ? marks[marks.length - 1]! : -1;
  if (pos <= last) return false;
  return pos < CELLS - 1 || marks.length >= MARKS_TO_LOCK;
}

/** The numbers each row could take with the current step's dice: [row, number] pairs. */
export function markOptions(g: RowsGame, seat = decider(g)): [number, number][] {
  if (!g.dice || (g.phase !== 'white' && g.phase !== 'colour')) return [];
  const sheet = g.sheets[seat]!;
  const out: [number, number][] = [];
  if (g.phase === 'white') {
    const n = whiteSum(g.dice);
    for (let r = 0; r < ROWS; r++) if (canMark(g, sheet, r, n)) out.push([r, n]);
  } else {
    for (let r = 0; r < ROWS; r++) {
      const c = g.dice.colour[r];
      if (c === null || c === undefined) continue;
      for (const n of new Set(g.dice.white.map((w) => w + c)))
        if (canMark(g, sheet, r, n)) out.push([r, n]);
    }
  }
  return out;
}

export function legalActions(g: RowsGame): string[] {
  if (g.phase === 'roll') return ['roll'];
  if (g.phase === 'over') return [];
  return ['pass', ...markOptions(g).map(([r, n]) => `mark:${r}:${n}`)];
}

export const rowCrosses = (s: Sheet, row: number) => s.marks[row]!.length + (s.locks[row] ? 1 : 0);
export const triangle = (n: number) => (n * (n + 1)) / 2;
export const rowScore = (s: Sheet, row: number) => triangle(rowCrosses(s, row));
export const sheetScore = (s: Sheet) =>
  [0, 1, 2, 3].reduce((a, r) => a + rowScore(s, r), 0) - 5 * s.penalties;

function applyPending(g: RowsGame): RowsGame {
  if (!g.pending.length) return g;
  const locked = [...g.locked];
  const colour = g.dice ? [...g.dice.colour] : [];
  for (const r of g.pending) {
    locked[r] = true;
    colour[r] = null;
  }
  return {
    ...g,
    locked,
    dice: g.dice ? { ...g.dice, colour } : null,
    pending: [],
    newLocks: [...g.newLocks, ...g.pending],
  };
}

const gameOver = (g: RowsGame) =>
  g.locked.filter(Boolean).length >= LOCKS_TO_END ||
  g.sheets.some((s) => s.penalties >= MAX_PENALTIES);

function mark(g: RowsGame, seat: number, row: number, n: number): RowsGame {
  const sheets = g.sheets.map((s, p) =>
    p === seat ? { ...s, marks: s.marks.map((m) => [...m]), locks: [...s.locks] } : s,
  );
  const sheet = sheets[seat]!;
  const pos = posOf(row, n);
  sheet.marks[row]!.push(pos);
  const pending = [...g.pending];
  if (pos === CELLS - 1) {
    sheet.locks[row] = true;
    if (!pending.includes(row)) pending.push(row);
  }
  return { ...g, sheets, pending, activeMarked: g.activeMarked || seat === g.active };
}

/** Ends the thrower's turn: the penalty, the locks, the end of the game or the next thrower. */
function endThrow(g: RowsGame): RowsGame {
  let next = applyPending(g);
  let penalty: number | null = null;
  // No penalty when the game ended on locks before the thrower's colour step.
  const cutShort = g.phase === 'white';
  if (!next.activeMarked && !cutShort) {
    penalty = next.active;
    next = {
      ...next,
      sheets: next.sheets.map((s, p) =>
        p === next.active ? { ...s, penalties: s.penalties + 1 } : s,
      ),
    };
  }
  const event = { penalty, locked: next.newLocks };
  const base = { ...next, dice: null, queue: [], activeMarked: false, newLocks: [], event };
  if (gameOver(next)) return { ...base, phase: 'over' };
  return { ...base, phase: 'roll', active: (next.active + 1) % next.players };
}

export function act(g: RowsGame, action: string): RowsGame {
  if (!legalActions(g).includes(action)) return g;
  const history = [...g.history, action];
  if (action === 'roll') {
    let rng = g.rng;
    const die = () => {
      const [x, nextRng] = nextUint32(rng);
      rng = nextRng;
      return 1 + (x % 6);
    };
    const white: [number, number] = [die(), die()];
    const colour = g.locked.map((l) => {
      const d = die();
      return l ? null : d;
    });
    const queue = Array.from({ length: g.players }, (_, i) => (g.active + i) % g.players);
    return {
      ...g,
      rng,
      dice: { white, colour },
      phase: 'white',
      queue,
      activeMarked: false,
      pending: [],
      newLocks: [],
      event: null,
      history,
    };
  }
  const seat = decider(g);
  let next = g;
  if (action !== 'pass') {
    const [, r, n] = action.split(':').map(Number);
    next = mark(g, seat, r!, n!);
  }
  next = { ...next, history };
  if (g.phase === 'white') {
    const queue = next.queue.slice(1);
    if (queue.length) return { ...next, queue };
    next = applyPending({ ...next, queue: [] });
    if (gameOver(next)) return endThrow(next);
    return { ...next, phase: 'colour' };
  }
  return endThrow(next);
}

export function isValidRows(d: unknown): d is RowsGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as RowsGame;
  if (![1, 2, 3, 4].includes(s.players) || !Number.isInteger(s.seed) || s.seed < 0) return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newRows(s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.sheets, g.locked, g.active, g.dice, g.phase, g.queue, g.rng]) ===
    JSON.stringify([s.sheets, s.locked, s.active, s.dice, s.phase, s.queue, s.rng])
  );
}
