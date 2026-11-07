/**
 * Senet, after Timothy Kendall's reconstruction: 30 squares in three rows of ten, travelled in an
 * S (left to right, right to left, left to right); five pieces a side start alternating on squares
 * 1–10. The throw is four two-sided sticks: the light faces up count 1–4, and none up counts 5.
 * Throws of 1, 4 and 5 give another throw. A piece moves forward by the throw; it may not land on
 * its own piece; landing on a lone opposing piece swaps the two, but two or more opposing pieces in
 * a row protect each other, and three in a row cannot be passed. Every piece must stop on square
 * 26 (the House of Happiness); from there a 5 bears it off, and 1–4 take it to 27–30. Square 27
 * (the Water) sends a piece back to 15 (or the nearest free square before it); a piece on 28 leaves
 * with exactly 3, on 29 with exactly 2, on 30 with exactly 1. Squares 26–30 cannot be attacked.
 */
export type Side = 0 | 1;

export const PIECES = 5;
export const SQUARES = 30;
export const OFF = 31;
export const HAPPINESS = 26;
export const WATER = 27;
export const REBIRTH = 15;

/** board[i] for i = 1..30: 0 empty, 1 side 0, 2 side 1. */
export interface SenetPosition {
  board: number[];
  off: [number, number];
}

export const opp = (s: Side): Side => (s === 0 ? 1 : 0);
const mark = (s: Side) => s + 1;

export function startPosition(): SenetPosition {
  const board = new Array<number>(SQUARES + 1).fill(0);
  for (let sq = 1; sq <= 10; sq++) board[sq] = sq % 2 === 1 ? 1 : 2;
  return { board, off: [0, 0] };
}

/** Chances of each throw value 1–5 (index = value). */
export const THROW_ODDS = [0, 4 / 16, 6 / 16, 4 / 16, 1 / 16, 1 / 16];
export const extraThrow = (roll: number) => roll === 1 || roll === 4 || roll === 5;

export interface SenetMove {
  from: number;
  /** Where the piece ends (OFF when borne off; 15 or before when it fell in the water). */
  to: number;
  /** The square it would land on before the Water sends it back. */
  landed: number;
  swap: boolean;
}

const protectedAt = (board: readonly number[], sq: number) => {
  const who = board[sq]!;
  return who !== 0 && (board[sq - 1] === who || board[sq + 1] === who);
};

/** Whether three or more pieces of the opponent stand in a row anywhere strictly between from and to. */
function blockade(board: readonly number[], side: Side, from: number, to: number): boolean {
  const them = mark(opp(side));
  let run = 0;
  for (let sq = from + 1; sq < to; sq++) {
    run = board[sq] === them ? run + 1 : 0;
    if (run >= 3) return true;
  }
  return false;
}

function waterReturn(board: readonly number[]): number {
  for (let sq = REBIRTH; sq >= 1; sq--) if (board[sq] === 0) return sq;
  return REBIRTH;
}

export function legalMoves(pos: SenetPosition, side: Side, roll: number): SenetMove[] {
  const me = mark(side);
  const them = mark(opp(side));
  const out: SenetMove[] = [];
  for (let from = 1; from <= SQUARES; from++) {
    if (pos.board[from] !== me) continue;
    let landed = from + roll;
    // Leaving from the last squares needs the exact throw; from 26 a 5 leaves at once.
    if (from === HAPPINESS && roll === 5) landed = OFF;
    else if (from === 28) landed = roll === 3 ? OFF : -1;
    else if (from === 29) landed = roll === 2 ? OFF : -1;
    else if (from === 30) landed = roll === 1 ? OFF : -1;
    else if (from < HAPPINESS && landed > HAPPINESS) landed = -1;
    if (landed < 0) continue;
    if (landed === OFF) {
      out.push({ from, to: OFF, landed, swap: false });
      continue;
    }
    if (blockade(pos.board, side, from, landed)) continue;
    const there = pos.board[landed]!;
    if (there === me) continue;
    let swap = false;
    if (there === them) {
      if (landed >= HAPPINESS || protectedAt(pos.board, landed)) continue;
      swap = true;
    }
    const to = landed === WATER ? waterReturn(pos.board) : landed;
    out.push({ from, to, landed, swap });
  }
  return out;
}

export function applyMove(pos: SenetPosition, side: Side, m: SenetMove): SenetPosition {
  const board = [...pos.board];
  const off: [number, number] = [pos.off[0], pos.off[1]];
  board[m.from] = 0;
  if (m.to === OFF) off[side]++;
  else if (m.swap) {
    board[m.from] = mark(opp(side));
    board[m.to] = mark(side);
  } else board[m.to] = mark(side);
  return { board, off };
}

export const posKey = (p: SenetPosition) => `${p.board.join('')}|${p.off.join(',')}`;

/** Squares travelled by a side's pieces (31 each when off). */
export function progress(p: SenetPosition, side: Side): number {
  const me = mark(side);
  return p.off[side] * OFF + p.board.reduce((n, who, sq) => n + (who === me ? sq : 0), 0);
}

/** Grid cell (column 0–9, row 0–2) of a square: rows run left to right, right to left, left to right. */
export function cellOf(sq: number): [number, number] {
  const row = Math.floor((sq - 1) / 10);
  const k = (sq - 1) % 10;
  return [row === 1 ? 9 - k : k, row];
}
