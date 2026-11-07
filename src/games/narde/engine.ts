/**
 * Long Narde rules: both sides start with 15 checkers on their head point and race the same way
 * round the board into their home and off. A single checker holds a point (no hitting, no bar);
 * only one checker may leave the head each turn (two with 6-6, 4-4 or 3-3 on a side's first
 * turn); a play may not leave six points in a row closed off unless an opposing checker is
 * already past them; and, as in backgammon, as many dice as possible must be used (the larger
 * one when only one fits). Bearing off once all 15 are home, with the exact die or a higher one
 * from the farthest point.
 *
 * Coordinates: each side numbers points 1–24 along its own path (24 = its head, 1–6 = its home).
 * Side 0's point p is physical point p; side 1's point q is physical point ((q + 11) mod 24) + 1,
 * the same formula both ways, so the heads sit diagonally opposite.
 */
export type Side = 0 | 1;

export interface Position {
  /** Checkers per point, per side, in that side's own numbering (index 1..24). */
  board: [number[], number[]];
  off: [number, number];
}

export interface Step {
  from: number;
  to: number;
  die: number;
}

export interface Play {
  steps: Step[];
  result: Position;
}

export const HEAD = 24;
export const OFF = 0;
export const opp = (s: Side): Side => (s === 0 ? 1 : 0);
/** The other side's number for the same physical point (an involution). */
export const across = (p: number) => ((p + 11) % 24) + 1;
/** Physical point (side 0's numbering) of a side's own point. */
export const physical = (side: Side, p: number) => (side === 0 ? p : across(p));

export function startPosition(): Position {
  const side = () => {
    const b = new Array<number>(25).fill(0);
    b[HEAD] = 15;
    return b;
  };
  return { board: [side(), side()], off: [0, 0] };
}

export const clonePos = (p: Position): Position => ({
  board: [[...p.board[0]], [...p.board[1]]],
  off: [p.off[0], p.off[1]],
});

export const posKey = (p: Position) =>
  `${p.board[0].join(',')}|${p.board[1].join(',')}|${p.off.join(',')}`;

export const allHome = (pos: Position, side: Side) => {
  for (let p = 7; p <= 24; p++) if (pos.board[side][p]) return false;
  return true;
};

const blockedFor = (pos: Position, side: Side, p: number) => pos.board[opp(side)][across(p)]! > 0;

export function target(pos: Position, side: Side, from: number, die: number): Step | null {
  const mine = pos.board[side];
  if (!mine[from]) return null;
  const to = from - die;
  if (to <= 0) {
    if (!allHome(pos, side)) return null;
    if (to < 0) for (let p = from + 1; p <= 6; p++) if (mine[p]) return null;
    return { from, to: OFF, die };
  }
  if (blockedFor(pos, side, to)) return null;
  return { from, to, die };
}

export function applyStep(pos: Position, side: Side, st: Step): Position {
  const next = clonePos(pos);
  next.board[side][st.from]!--;
  if (st.to === OFF) next.off[side]++;
  else next.board[side][st.to]!++;
  return next;
}

/**
 * Whether `side` closes six points in a row with no opposing checker past them. The opponent is
 * "past" a run when one of its checkers stands nearer its own home than every point of the run.
 */
export function illegalPrime(pos: Position, side: Side): boolean {
  const them = opp(side);
  let run = 0;
  for (let p = 24; p >= 1; p--) {
    run = pos.board[side][p]! > 0 ? run + 1 : 0;
    if (run < 6) continue;
    const points = [p, p + 1, p + 2, p + 3, p + 4, p + 5].map(across);
    const lowest = Math.min(...points);
    let past = pos.off[them] > 0;
    for (let q = 1; q < lowest && !past; q++) if (pos.board[them][q]) past = true;
    if (!past) return true;
  }
  return false;
}

/**
 * Every legal order of single steps for a roll. `first` marks the side's first turn, when 6-6,
 * 4-4 and 3-3 may take two checkers off the head.
 */
export function legalSequences(
  pos: Position,
  side: Side,
  dice: readonly [number, number],
  first: boolean,
): Play[] {
  const [a, b] = dice;
  const orders: number[][] =
    a === b
      ? [[a, a, a, a]]
      : [
          [a, b],
          [b, a],
        ];
  const headLimit = first && a === b && (a === 6 || a === 4 || a === 3) ? 2 : 1;
  let best = 0;
  let out: Play[] = [];
  const walk = (p: Position, rest: number[], steps: Step[], fromHead: number) => {
    let moved = false;
    if (rest.length) {
      const die = rest[0]!;
      for (let from = 24; from >= 1; from--) {
        if (from === HEAD && fromHead >= headLimit) continue;
        const st = target(p, side, from, die);
        if (!st) continue;
        const next = applyStep(p, side, st);
        if (illegalPrime(next, side)) continue;
        moved = true;
        walk(next, rest.slice(1), [...steps, st], fromHead + (from === HEAD ? 1 : 0));
      }
    }
    if (moved) return;
    if (steps.length > best) {
      best = steps.length;
      out = [];
    }
    if (steps.length === best) out.push({ steps, result: p });
  };
  for (const order of orders) walk(pos, order, [], 0);
  if (a !== b && best === 1) {
    const hi = Math.max(a, b);
    if (out.some((pl) => pl.steps[0]!.die === hi))
      out = out.filter((pl) => pl.steps[0]!.die === hi);
  }
  return out;
}

export function legalPlays(
  pos: Position,
  side: Side,
  dice: readonly [number, number],
  first: boolean,
): Play[] {
  const found = new Map<string, Play>();
  for (const pl of legalSequences(pos, side, dice, first)) {
    const k = posKey(pl.result);
    if (!found.has(k)) found.set(k, pl);
  }
  return [...found.values()];
}

export const pips = (pos: Position, side: Side) =>
  pos.board[side].reduce((n, c, p) => n + c * p, 0);

/** 1 for a plain win (oin), 2 for a mars (the loser has borne nothing off). */
export const winValue = (pos: Position, winner: Side): 1 | 2 => (pos.off[opp(winner)] > 0 ? 1 : 2);

export const ALL_ROLLS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) out.push([a, b]);
  return out;
})();
export const rollWeight = (r: readonly [number, number]) => (r[0] === r[1] ? 1 / 36 : 2 / 36);
