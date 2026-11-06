/**
 * Tafl games (catalog #055 Hnefatafl, #056 Tablut): an asymmetric battle on a square board. The
 * attackers (seat 0, dark, move first) surround a king and his defenders (seat 1, light). Every
 * piece moves like a chess rook — any distance along a row or column through empty squares. Only
 * the king may stop on the throne (center) or, in corner-escape games, on a corner; other pieces
 * may pass through the empty throne.
 *
 * Captures are custodial: moving a piece so that an enemy soldier is sandwiched between it and
 * another of your pieces (or a hostile square — the corners, and the throne when empty) removes
 * it. A piece may safely move between two enemies. The king takes part in captures.
 *
 * The defenders win when the king reaches a corner (Hnefatafl) or any edge square (Tablut). The
 * attackers win by capturing the king: Hnefatafl needs all four sides closed by attackers or the
 * throne; Tablut needs four on the throne, three plus the throne next to it, and only two
 * (custodial) elsewhere. A side with no legal move loses. Threefold repetition or 300 plies is a
 * draw.
 *
 * Actions: "f-t" (from-to; squares row·size + col, row 0 at the top).
 */
import { IllegalActionError } from '../../../ai/protocols/types';
import { isRecord } from '../../../core/persistence/versioned';

export interface TaflVariant {
  id: string;
  size: number;
  /** Rows of the start diagram: '.' empty, 'a' attacker, 'd' defender, 'K' king. */
  layout: readonly string[];
  escape: 'corner' | 'edge';
  kingCapture: 'four' | 'tablut';
}

export const HNEFATAFL: TaflVariant = {
  id: 'hnefatafl',
  size: 11,
  layout: [
    '...aaaaa...',
    '.....a.....',
    '...........',
    'a....d....a',
    'a...ddd...a',
    'aa.ddKdd.aa',
    'a...ddd...a',
    'a....d....a',
    '...........',
    '.....a.....',
    '...aaaaa...',
  ],
  escape: 'corner',
  kingCapture: 'four',
};

export const TABLUT: TaflVariant = {
  id: 'tablut',
  size: 9,
  layout: [
    '...aaa...',
    '....a....',
    '....d....',
    'a...d...a',
    'aaddKddaa',
    'a...d...a',
    '....d....',
    '....a....',
    '...aaa...',
  ],
  escape: 'edge',
  kingCapture: 'tablut',
};

export const PLY_LIMIT = 300;

export interface TaflState {
  /** 0 empty, 1 attacker, 2 defender, 3 king. */
  board: number[];
  toMove: 0 | 1;
  history: string[];
  keys: string[];
  result: {
    winner: 0 | 1 | null;
    reason: 'escape' | 'king' | 'stuck' | 'repetition' | 'limit';
  } | null;
}

export const throneOf = (v: TaflVariant) => (v.size * v.size) >> 1;
export const cornersOf = (v: TaflVariant) => [
  0,
  v.size - 1,
  v.size * (v.size - 1),
  v.size * v.size - 1,
];
const owner = (piece: number) => (piece === 1 ? 0 : piece >= 2 ? 1 : -1);

export function createTaflState(v: TaflVariant): TaflState {
  const code: Record<string, number> = { '.': 0, a: 1, d: 2, K: 3 };
  const board = v.layout.flatMap((row) => [...row].map((ch) => code[ch]!));
  const s: TaflState = { board, toMove: 0, history: [], keys: [], result: null };
  s.keys = [keyOf(s)];
  return s;
}

const keyOf = (s: Pick<TaflState, 'board' | 'toMove'>) => `${s.board.join('')}|${s.toMove}`;

/** Squares only the king may stop on. */
export function restricted(v: TaflVariant, p: number): boolean {
  return p === throneOf(v) || (v.escape === 'corner' && cornersOf(v).includes(p));
}

/** Destinations of the piece on `from`. */
export function destinations(v: TaflVariant, board: readonly number[], from: number): number[] {
  const n = v.size;
  const piece = board[from]!;
  const out: number[] = [];
  const r0 = Math.floor(from / n);
  const c0 = from % n;
  for (const [dr, dc] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const) {
    let r = r0 + dr;
    let c = c0 + dc;
    while (r >= 0 && r < n && c >= 0 && c < n) {
      const p = r * n + c;
      if (board[p] !== 0) break;
      if (piece === 3 || !restricted(v, p)) out.push(p);
      // Ordinary pieces may pass over the empty throne but never through a corner.
      if (piece !== 3 && v.escape === 'corner' && cornersOf(v).includes(p)) break;
      r += dr;
      c += dc;
    }
  }
  return out;
}

export function movesOf(v: TaflVariant, board: readonly number[], seat: 0 | 1): [number, number][] {
  const out: [number, number][] = [];
  board.forEach((piece, p) => {
    if (owner(piece) !== seat) return;
    for (const q of destinations(v, board, p)) out.push([p, q]);
  });
  return out;
}

export function legalTaflActions(v: TaflVariant, s: TaflState): string[] {
  if (s.result) return [];
  return movesOf(v, s.board, s.toMove).map(([p, q]) => `${p}-${q}`);
}

/** Whether square `p` is hostile to a piece of `seat` (helps capture it). */
function hostileTo(v: TaflVariant, board: readonly number[], p: number, seat: 0 | 1): boolean {
  const piece = board[p]!;
  if (piece !== 0) return owner(piece) === 1 - seat;
  if (v.escape === 'corner' && cornersOf(v).includes(p)) return true;
  return p === throneOf(v);
}

const NEIGHBOR_STEPS = (n: number) => [-n, n, -1, 1];

function neighbor(n: number, p: number, d: number): number {
  const r = Math.floor(p / n);
  const c = p % n;
  if (d === -n) return r > 0 ? p - n : -1;
  if (d === n) return r < n - 1 ? p + n : -1;
  if (d === -1) return c > 0 ? p - 1 : -1;
  return c < n - 1 ? p + 1 : -1;
}

/** Whether the king on `k` is captured by attackers on `board`. */
export function kingCaptured(v: TaflVariant, board: readonly number[], k: number): boolean {
  const n = v.size;
  const throne = throneOf(v);
  const sides = NEIGHBOR_STEPS(n).map((d) => neighbor(n, k, d));
  if (sides.some((q) => q < 0)) return false; // on the edge
  const closed = (q: number) => board[q] === 1 || (q === throne && board[q] === 0);
  if (v.kingCapture === 'four' || k === throne || sides.includes(throne))
    return sides.every(closed);
  // Tablut away from the throne: custodial along either line.
  return (closed(sides[0]!) && closed(sides[1]!)) || (closed(sides[2]!) && closed(sides[3]!));
}

export function applyTaflAction(v: TaflVariant, s: TaflState, a: string): TaflState {
  if (s.result || !legalTaflActions(v, s).includes(a))
    throw new IllegalActionError(`Illegal move ${a}`);
  const n = v.size;
  const [from, to] = a.split('-').map(Number) as [number, number];
  const board = s.board.slice();
  const piece = board[from]!;
  board[to] = piece;
  board[from] = 0;
  const me = s.toMove;
  let kingTaken = false;
  for (const d of NEIGHBOR_STEPS(n)) {
    const q = neighbor(n, to, d);
    if (q < 0 || owner(board[q]!) !== 1 - me) continue;
    if (board[q] === 3) {
      if (me === 0 && kingCaptured(v, board, q)) kingTaken = true;
      continue;
    }
    const beyond = neighbor(n, q, d);
    if (beyond >= 0 && hostileTo(v, board, beyond, (1 - me) as 0 | 1)) board[q] = 0;
  }
  const toMove = (1 - me) as 0 | 1;
  const history = [...s.history, a];
  const base = { board, toMove };
  const keys = [...s.keys, keyOf(base)];
  let result: TaflState['result'] = null;
  const escaped =
    piece === 3 &&
    (v.escape === 'corner'
      ? cornersOf(v).includes(to)
      : Math.floor(to / n) === 0 ||
        Math.floor(to / n) === n - 1 ||
        to % n === 0 ||
        to % n === n - 1);
  if (escaped) result = { winner: 1, reason: 'escape' };
  else if (kingTaken) result = { winner: 0, reason: 'king' };
  else if (movesOf(v, board, toMove).length === 0) result = { winner: me, reason: 'stuck' };
  else if (keys.filter((k) => k === keys[keys.length - 1]).length >= 3)
    result = { winner: null, reason: 'repetition' };
  else if (history.length >= PLY_LIMIT) result = { winner: null, reason: 'limit' };
  return { board, toMove, history, keys, result };
}

export function replayTafl(v: TaflVariant, history: readonly string[]): TaflState {
  return history.reduce((s, a) => applyTaflAction(v, s, a), createTaflState(v));
}

export function isValidTaflState(v: TaflVariant, data: unknown): data is TaflState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    return JSON.stringify(replayTafl(v, data.history as string[])) === JSON.stringify(data);
  } catch {
    return false;
  }
}
