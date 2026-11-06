/**
 * Morris family (#030 Nine, #031 Three, #032 Six Men's Morris): placement phase, movement along
 * the board lines, flying with three pieces (where the variant allows it), mills that remove an
 * opponent piece (or win outright in Three Men's Morris), blocked players losing, and draws by
 * repetition or by a long phase without mills. Actions: "e4" (place), "e4xd7" (place and remove),
 * "d6-d5" (move), "d6-d5xa1" (move and remove).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export interface MorrisVariant {
  id: string;
  /** Point names on the drawn board (standard a1…g7 coordinates). */
  points: readonly string[];
  /** Adjacent point pairs along the drawn lines. */
  edges: readonly (readonly [string, string])[];
  /** Lines of three that form a mill. */
  mills: readonly (readonly [string, string, string])[];
  /** Pieces each player places. */
  pieces: number;
  /** A player reduced to three pieces may move to any empty point. */
  flying: boolean;
  /** Three Men's Morris: a mill wins at once instead of removing a piece. */
  millWins: boolean;
  /** Movement plies without a mill (or placement) after which the game is drawn. */
  quietLimit: number;
}

export type MorrisResult =
  | { kind: 'win'; winner: 0 | 1; reason: 'two-pieces' | 'blocked' | 'mill' }
  | { kind: 'draw'; reason: 'repetition' | 'quiet' };

export interface MorrisState {
  /** 0 empty, 1 = seat 0 (White, moves first), 2 = seat 1 (Black), by point index. */
  board: number[];
  toMove: 0 | 1;
  /** Pieces still to place per seat. */
  inHand: [number, number];
  history: string[];
  /** Position keys after each ply (index 0 = start), for repetition. */
  keys: string[];
  /** Plies since the last mill or placement. */
  quiet: number;
  result: MorrisResult | null;
}

export interface MorrisMove {
  from: number; // -1 when placing
  to: number;
  remove: number; // -1 when no mill
}

interface Geometry {
  index: Map<string, number>;
  adjacent: number[][];
  millsOf: number[][][]; // per point: the mills through it (as point index triples)
  mills: number[][];
}

const geometry = new Map<string, Geometry>();
export function geometryOf(v: MorrisVariant): Geometry {
  let g = geometry.get(v.id);
  if (!g) {
    const index = new Map(v.points.map((p, i) => [p, i]));
    const id = (p: string) => {
      const i = index.get(p);
      if (i === undefined) throw new Error(`Unknown point ${p}`);
      return i;
    };
    const adjacent: number[][] = v.points.map(() => []);
    for (const [a, b] of v.edges) {
      adjacent[id(a)]!.push(id(b));
      adjacent[id(b)]!.push(id(a));
    }
    const mills = v.mills.map((m) => m.map(id));
    const millsOf: number[][][] = v.points.map(() => []);
    for (const m of mills) for (const p of m) millsOf[p]!.push(m);
    g = { index, adjacent, millsOf, mills };
    geometry.set(v.id, g);
  }
  return g;
}

const keyOf = (s: Pick<MorrisState, 'board' | 'toMove' | 'inHand'>) =>
  `${s.board.join('')}|${s.toMove}|${s.inHand.join(',')}`;

export function createMorrisState(v: MorrisVariant): MorrisState {
  const s = {
    board: new Array<number>(v.points.length).fill(0),
    toMove: 0 as const,
    inHand: [v.pieces, v.pieces] as [number, number],
  };
  return { ...s, history: [], keys: [keyOf(s)], quiet: 0, result: null };
}

const count = (board: readonly number[], color: number) =>
  board.reduce((n, x) => n + (x === color ? 1 : 0), 0);

export function inMill(g: Geometry, board: readonly number[], p: number): boolean {
  const c = board[p];
  return !!c && g.millsOf[p]!.some((m) => m.every((q) => board[q] === c));
}

/** Points of `color` that may be removed: not in a mill, unless every piece is in a mill. */
export function removable(g: Geometry, board: readonly number[], color: number): number[] {
  const own = board.flatMap((x, p) => (x === color ? [p] : []));
  const free = own.filter((p) => !inMill(g, board, p));
  return free.length ? free : own;
}

/** All legal moves for the side to move (each mill-forming move expanded per removal). */
export function legalMorrisMoves(v: MorrisVariant, s: MorrisState): MorrisMove[] {
  if (s.result) return [];
  const g = geometryOf(v);
  const me = s.toMove + 1;
  const enemy = 3 - me;
  const out: MorrisMove[] = [];
  const add = (from: number, to: number) => {
    const board = s.board.slice();
    if (from >= 0) board[from] = 0;
    board[to] = me;
    if (!v.millWins && inMill(g, board, to)) {
      for (const r of removable(g, board, enemy)) out.push({ from, to, remove: r });
    } else out.push({ from, to, remove: -1 });
  };
  if (s.inHand[s.toMove] > 0) {
    s.board.forEach((x, p) => x === 0 && add(-1, p));
    return out;
  }
  const flying = v.flying && count(s.board, me) === 3;
  s.board.forEach((x, from) => {
    if (x !== me) return;
    const targets = flying ? s.board.flatMap((y, p) => (y === 0 ? [p] : [])) : g.adjacent[from]!;
    for (const to of targets) if (s.board[to] === 0) add(from, to);
  });
  return out;
}

export function moveName(v: MorrisVariant, m: MorrisMove): string {
  const p = v.points;
  return `${m.from >= 0 ? `${p[m.from]}-` : ''}${p[m.to]}${m.remove >= 0 ? `x${p[m.remove]}` : ''}`;
}

export function legalMorrisActions(v: MorrisVariant, s: MorrisState): string[] {
  return legalMorrisMoves(v, s).map((m) => moveName(v, m));
}

export function applyMorrisAction(v: MorrisVariant, s: MorrisState, action: string): MorrisState {
  if (s.result) throw new IllegalActionError('The game is over');
  const move = legalMorrisMoves(v, s).find((m) => moveName(v, m) === action);
  if (!move) throw new IllegalActionError(`Move ${action} is not legal`);
  const g = geometryOf(v);
  const me = s.toMove + 1;
  const board = s.board.slice();
  if (move.from >= 0) board[move.from] = 0;
  board[move.to] = me;
  if (move.remove >= 0) board[move.remove] = 0;
  const inHand: [number, number] = [s.inHand[0], s.inHand[1]];
  if (move.from < 0) inHand[s.toMove]--;
  const toMove = (1 - s.toMove) as 0 | 1;
  const madeMill = inMill(g, board, move.to);
  const quiet = move.from < 0 || madeMill ? 0 : s.quiet + 1;
  const next = { board, toMove, inHand };
  const keys = [...s.keys, keyOf(next)];
  let result: MorrisResult | null = null;
  const enemyTotal = count(board, 3 - me) + inHand[toMove];
  if (v.millWins && madeMill) result = { kind: 'win', winner: s.toMove, reason: 'mill' };
  else if (!v.millWins && enemyTotal < 3)
    result = { kind: 'win', winner: s.toMove, reason: 'two-pieces' };
  else {
    const probe: MorrisState = { ...next, history: [], keys, quiet, result: null };
    if (legalMorrisMoves(v, probe).length === 0)
      result = { kind: 'win', winner: s.toMove, reason: 'blocked' };
    else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
      result = { kind: 'draw', reason: 'repetition' };
    else if (quiet >= v.quietLimit) result = { kind: 'draw', reason: 'quiet' };
  }
  return { ...next, history: [...s.history, action], keys, quiet, result };
}

export function replayMorris(v: MorrisVariant, history: readonly string[]): MorrisState {
  return history.reduce((s, a) => applyMorrisAction(v, s, a), createMorrisState(v));
}

export function isValidMorrisState(v: MorrisVariant, data: unknown): data is MorrisState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayMorris(v, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}

// ---- boards ---------------------------------------------------------------------------------

const NINE_POINTS = [
  'a7',
  'd7',
  'g7',
  'b6',
  'd6',
  'f6',
  'c5',
  'd5',
  'e5',
  'a4',
  'b4',
  'c4',
  'e4',
  'f4',
  'g4',
  'c3',
  'd3',
  'e3',
  'b2',
  'd2',
  'f2',
  'a1',
  'd1',
  'g1',
];
const NINE_MILLS: [string, string, string][] = [
  ['a7', 'd7', 'g7'],
  ['b6', 'd6', 'f6'],
  ['c5', 'd5', 'e5'],
  ['a4', 'b4', 'c4'],
  ['e4', 'f4', 'g4'],
  ['c3', 'd3', 'e3'],
  ['b2', 'd2', 'f2'],
  ['a1', 'd1', 'g1'],
  ['a7', 'a4', 'a1'],
  ['b6', 'b4', 'b2'],
  ['c5', 'c4', 'c3'],
  ['d7', 'd6', 'd5'],
  ['d3', 'd2', 'd1'],
  ['e5', 'e4', 'e3'],
  ['f6', 'f4', 'f2'],
  ['g7', 'g4', 'g1'],
];
const edgesFromMills = (mills: [string, string, string][]) =>
  mills.flatMap(([a, b, c]) => [
    [a, b],
    [b, c],
  ]) as [string, string][];

export const NINE_MENS: MorrisVariant = {
  id: 'nine',
  points: NINE_POINTS,
  edges: edgesFromMills(NINE_MILLS),
  mills: NINE_MILLS,
  pieces: 9,
  flying: true,
  millWins: false,
  quietLimit: 100,
};

const SIX_POINTS = [
  'b6',
  'd6',
  'f6',
  'c5',
  'd5',
  'e5',
  'b4',
  'c4',
  'e4',
  'f4',
  'c3',
  'd3',
  'e3',
  'b2',
  'd2',
  'f2',
];
const SIX_MILLS: [string, string, string][] = [
  ['b6', 'd6', 'f6'],
  ['c5', 'd5', 'e5'],
  ['c3', 'd3', 'e3'],
  ['b2', 'd2', 'f2'],
  ['b6', 'b4', 'b2'],
  ['c5', 'c4', 'c3'],
  ['e5', 'e4', 'e3'],
  ['f6', 'f4', 'f2'],
];

export const SIX_MENS: MorrisVariant = {
  id: 'six',
  points: SIX_POINTS,
  // The squares' sides plus the four spokes joining their midpoints.
  edges: [...edgesFromMills(SIX_MILLS), ['d6', 'd5'], ['b4', 'c4'], ['e4', 'f4'], ['d3', 'd2']],
  mills: SIX_MILLS,
  pieces: 6,
  flying: false,
  millWins: false,
  quietLimit: 100,
};

const THREE_POINTS = ['a3', 'b3', 'c3', 'a2', 'b2', 'c2', 'a1', 'b1', 'c1'];
const THREE_LINES: [string, string, string][] = [
  ['a3', 'b3', 'c3'],
  ['a2', 'b2', 'c2'],
  ['a1', 'b1', 'c1'],
  ['a3', 'a2', 'a1'],
  ['b3', 'b2', 'b1'],
  ['c3', 'c2', 'c1'],
  ['a3', 'b2', 'c1'],
  ['c3', 'b2', 'a1'],
];

export const THREE_MENS: MorrisVariant = {
  id: 'three',
  points: THREE_POINTS,
  edges: edgesFromMills(THREE_LINES),
  // Rows and columns form mills; the diagonals are lines to move along but do not count.
  mills: THREE_LINES.slice(0, 6),
  pieces: 3,
  flying: false,
  millWins: true,
  quietLimit: 60,
};
