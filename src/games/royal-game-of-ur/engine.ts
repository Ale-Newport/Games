/**
 * The Royal Game of Ur, with the rules reconstructed by Irving Finkel from a cuneiform tablet: two
 * sides of seven pieces race along their own 14-square paths (squares 1–4 and 13–14 private,
 * 5–12 shared down the middle) and off at 15 with an exact throw. The throw is four binary dice
 * (0–4). Landing on an opposing piece on a shared square sends it home; landing on a rosette (4, 8,
 * 14) gives another throw, and the shared middle rosette (8) is a safe square. A piece may not land
 * on its own side's piece, and a throw with no legal move (or a 0) passes the turn.
 *
 * Squares are numbered along each side's own path; both paths share squares 5–12 in the same order.
 */
export type Side = 0 | 1;

export const PIECES = 7;
export const END = 15;
export const ROSETTES = [4, 8, 14];
export const SAFE = 8;
export const isShared = (sq: number) => sq >= 5 && sq <= 12;

export interface UrPosition {
  /** Occupied squares 1..14 per side (index 0 unused). */
  board: [boolean[], boolean[]];
  /** Pieces still to enter, and pieces borne off. */
  waiting: [number, number];
  off: [number, number];
}

export const opp = (s: Side): Side => (s === 0 ? 1 : 0);

export function startPosition(): UrPosition {
  return {
    board: [new Array<boolean>(15).fill(false), new Array<boolean>(15).fill(false)],
    waiting: [PIECES, PIECES],
    off: [0, 0],
  };
}

export const clonePos = (p: UrPosition): UrPosition => ({
  board: [[...p.board[0]], [...p.board[1]]],
  waiting: [p.waiting[0], p.waiting[1]],
  off: [p.off[0], p.off[1]],
});

/** Chances of each throw (the number of marked tips up among four tetrahedral dice). */
export const THROW_ODDS = [1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16];

export interface UrMove {
  /** The square moved from (0 = entering). */
  from: number;
  to: number;
  capture: boolean;
  rosette: boolean;
}

/** Legal moves for a throw: one per piece (entering counts as square 0). */
export function legalMoves(pos: UrPosition, side: Side, roll: number): UrMove[] {
  if (roll === 0) return [];
  const mine = pos.board[side];
  const theirs = pos.board[opp(side)];
  const out: UrMove[] = [];
  const consider = (from: number) => {
    const to = from + roll;
    if (to > END) return;
    if (to === END) {
      out.push({ from, to, capture: false, rosette: false });
      return;
    }
    if (mine[to]) return;
    const capture = isShared(to) && theirs[to]!;
    if (capture && to === SAFE) return;
    out.push({ from, to, capture, rosette: ROSETTES.includes(to) });
  };
  if (pos.waiting[side] > 0) consider(0);
  for (let sq = 1; sq <= 14; sq++) if (mine[sq]) consider(sq);
  return out;
}

export function applyMove(pos: UrPosition, side: Side, m: UrMove): UrPosition {
  const next = clonePos(pos);
  if (m.from === 0) next.waiting[side]--;
  else next.board[side][m.from] = false;
  if (m.to === END) next.off[side]++;
  else {
    next.board[side][m.to] = true;
    if (m.capture) {
      next.board[opp(side)][m.to] = false;
      next.waiting[opp(side)]++;
    }
  }
  return next;
}

export const posKey = (p: UrPosition) =>
  `${p.board[0].map(Number).join('')}|${p.board[1].map(Number).join('')}|${p.waiting.join(',')}|${p.off.join(',')}`;

/** How far a side has come: squares travelled by its pieces (15 each when off). */
export const progress = (p: UrPosition, side: Side) =>
  p.off[side] * END + p.board[side].reduce((n, on, sq) => n + (on ? sq : 0), 0);
