/**
 * Backgammon rules: 24 points, 15 checkers a side, two dice (doubles play four times), entering
 * from the bar first, hitting single checkers, bearing off once every checker is home, and the
 * rule that a player must use as many dice as possible (and the larger one when only one fits).
 *
 * Coordinates: each side counts points from its own home, 1–24, and moves downward toward 0 (off).
 * `board[side][p]` (p = 1..24 in that side's numbering) is how many of its checkers stand there;
 * index 0 is unused, `bar[side]` and `off[side]` count the rest. A point p for one side is point
 * 25 − p for the other.
 */
export type Side = 0 | 1;

export interface Position {
  /** Checkers per point, per side, in that side's own numbering (index 1..24). */
  board: [number[], number[]];
  bar: [number, number];
  off: [number, number];
}

/** One checker step: from a point (25 = the bar) to a point (0 = off). */
export interface Step {
  from: number;
  to: number;
  die: number;
  hit: boolean;
}

export const BAR = 25;
export const OFF = 0;

export const opp = (s: Side): Side => (s === 0 ? 1 : 0);
/** The other side's number for the same physical point. */
export const mirror = (p: number) => 25 - p;

export function startPosition(): Position {
  const side = () => {
    const b = new Array<number>(25).fill(0);
    b[24] = 2;
    b[13] = 5;
    b[8] = 3;
    b[6] = 5;
    return b;
  };
  return { board: [side(), side()], bar: [0, 0], off: [0, 0] };
}

export const clonePos = (p: Position): Position => ({
  board: [[...p.board[0]], [...p.board[1]]],
  bar: [p.bar[0], p.bar[1]],
  off: [p.off[0], p.off[1]],
});

/** Checkers of the other side on the same physical point as `p` (in `side`'s numbering). */
const against = (pos: Position, side: Side, p: number) => pos.board[opp(side)][mirror(p)]!;

export const allHome = (pos: Position, side: Side) => {
  if (pos.bar[side]) return false;
  for (let p = 7; p <= 24; p++) if (pos.board[side][p]) return false;
  return true;
};

/** Where a checker on `from` lands with `die`, or null if it cannot move that way. */
export function target(pos: Position, side: Side, from: number, die: number): Step | null {
  const mine = pos.board[side];
  if (from === BAR) {
    if (!pos.bar[side]) return null;
  } else {
    if (pos.bar[side] || !mine[from]) return null;
  }
  const to = from - die;
  if (to <= 0) {
    if (!allHome(pos, side)) return null;
    if (to < 0) {
      // A higher die bears off only from the highest occupied point.
      for (let p = from + 1; p <= 6; p++) if (mine[p]) return null;
    }
    return { from, to: OFF, die, hit: false };
  }
  const there = against(pos, side, to);
  if (there >= 2) return null;
  return { from, to, die, hit: there === 1 };
}

export function applyStep(pos: Position, side: Side, st: Step): Position {
  const next = clonePos(pos);
  if (st.from === BAR) next.bar[side]--;
  else next.board[side][st.from]!--;
  if (st.to === OFF) next.off[side]++;
  else {
    next.board[side][st.to]!++;
    if (st.hit) {
      next.board[opp(side)][mirror(st.to)]!--;
      next.bar[opp(side)]++;
    }
  }
  return next;
}

/** Every point a side could move a checker from with `die`. */
export function stepsFor(pos: Position, side: Side, die: number): Step[] {
  const out: Step[] = [];
  if (pos.bar[side]) {
    const st = target(pos, side, BAR, die);
    return st ? [st] : [];
  }
  for (let p = 24; p >= 1; p--) {
    if (!pos.board[side][p]) continue;
    const st = target(pos, side, p, die);
    if (st) out.push(st);
  }
  return out;
}

export const posKey = (p: Position) =>
  `${p.board[0].join(',')}|${p.board[1].join(',')}|${p.bar.join(',')}|${p.off.join(',')}`;

export interface Play {
  steps: Step[];
  result: Position;
}

/**
 * Every legal order of single steps for a roll: as many dice as can be used, and with two
 * different dice of which only one can be used, the larger when possible. The table lets a player
 * make the steps one at a time along these.
 */
export function legalSequences(pos: Position, side: Side, dice: readonly [number, number]): Play[] {
  const [a, b] = dice;
  const orders: number[][] =
    a === b
      ? [[a, a, a, a]]
      : [
          [a, b],
          [b, a],
        ];
  let best = 0;
  let out: Play[] = [];
  const walk = (p: Position, rest: number[], steps: Step[]) => {
    let moved = false;
    if (rest.length) {
      for (const st of stepsFor(p, side, rest[0]!)) {
        moved = true;
        walk(applyStep(p, side, st), rest.slice(1), [...steps, st]);
      }
    }
    if (moved) return;
    if (steps.length > best) {
      best = steps.length;
      out = [];
    }
    if (steps.length === best) out.push({ steps, result: p });
  };
  for (const order of orders) walk(pos, order, []);
  if (a !== b && best === 1) {
    const hi = Math.max(a, b);
    if (out.some((pl) => pl.steps[0]!.die === hi))
      out = out.filter((pl) => pl.steps[0]!.die === hi);
  }
  return out;
}

/** The legal plays of a roll, one per distinct resulting position. */
export function legalPlays(pos: Position, side: Side, dice: readonly [number, number]): Play[] {
  const found = new Map<string, Play>();
  for (const pl of legalSequences(pos, side, dice)) {
    const k = posKey(pl.result);
    if (!found.has(k)) found.set(k, pl);
  }
  return [...found.values()];
}

export const pips = (pos: Position, side: Side) =>
  pos.board[side].reduce((n, c, p) => n + c * p, 0) + pos.bar[side] * 25;

/** 1 for a single game, 2 for a gammon (no checker off), 3 for a backgammon (also one still in the winner's home or on the bar). */
export function winValue(pos: Position, winner: Side): 1 | 2 | 3 {
  const loser = opp(winner);
  if (pos.off[loser] > 0) return 1;
  if (pos.bar[loser]) return 3;
  // The winner's home is points 1–6 for the winner, 19–24 for the loser.
  for (let p = 19; p <= 24; p++) if (pos.board[loser][p]) return 3;
  return 2;
}

export const ALL_ROLLS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) out.push([a, b]);
  return out;
})();
/** Chance of each of the 21 distinct rolls. */
export const rollWeight = (r: readonly [number, number]) => (r[0] === r[1] ? 1 / 36 : 2 / 36);
