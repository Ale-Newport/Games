/**
 * Renju forbidden-move detection for Black (RIF definitions):
 *  - five: exactly five in a row (always allowed — it wins, even if it also forms a forbidden shape);
 *  - overline: six or more in a row → forbidden;
 *  - four: a line where one more stone makes exactly five; two or more fours → forbidden (4-4);
 *  - three: a line that one more (non-forbidden) stone turns into a straight four (four with both
 *    ends open, each end making exactly five); two or more threes → forbidden (3-3).
 * Works on any square board stored row-major with 0 empty, 1 black, 2 white.
 */
const DIRS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

const BLACK = 1;

interface Ctx {
  board: number[];
  n: number;
}

const inside = (n: number, r: number, c: number) => r >= 0 && r < n && c >= 0 && c < n;

/** Length of the unbroken black run through (r, c) along a direction (stone at r,c assumed black). */
function runLength(ctx: Ctx, r: number, c: number, dr: number, dc: number): number {
  let len = 1;
  for (const s of [1, -1]) {
    let rr = r + dr * s;
    let cc = c + dc * s;
    while (inside(ctx.n, rr, cc) && ctx.board[rr * ctx.n + cc] === BLACK) {
      len++;
      rr += dr * s;
      cc += dc * s;
    }
  }
  return len;
}

const exactFiveAt = (ctx: Ctx, r: number, c: number, dr: number, dc: number) =>
  runLength(ctx, r, c, dr, dc) === 5;

/** Empty points along the line through (r,c) where a black stone would make exactly five in this direction. */
function fivePoints(ctx: Ctx, r: number, c: number, dr: number, dc: number): number[] {
  const points: number[] = [];
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const rr = r + dr * k;
    const cc = c + dc * k;
    if (!inside(ctx.n, rr, cc)) continue;
    const i = rr * ctx.n + cc;
    if (ctx.board[i] !== 0) continue;
    ctx.board[i] = BLACK;
    // The five must include the original stone at (r, c).
    const makesFive = exactFiveAt(ctx, rr, cc, dr, dc) && runIncludes(ctx, rr, cc, dr, dc, r, c);
    ctx.board[i] = 0;
    if (makesFive) points.push(i);
  }
  return points;
}

function runIncludes(
  ctx: Ctx,
  r: number,
  c: number,
  dr: number,
  dc: number,
  tr: number,
  tc: number,
): boolean {
  if (r === tr && c === tc) return true;
  for (const s of [1, -1]) {
    let rr = r + dr * s;
    let cc = c + dc * s;
    while (inside(ctx.n, rr, cc) && ctx.board[rr * ctx.n + cc] === BLACK) {
      if (rr === tr && cc === tc) return true;
      rr += dr * s;
      cc += dc * s;
    }
  }
  return false;
}

/** Number of fours through (r,c) in this direction: 0, 1 (incl. a straight four) or 2 (same-line double four). */
function foursInDirection(ctx: Ctx, r: number, c: number, dr: number, dc: number): number {
  const points = fivePoints(ctx, r, c, dr, dc);
  if (points.length === 0) return 0;
  if (points.length === 1) return 1;
  // Two five-points: a straight four (one four) if they are the two ends of one run of four.
  const [a, b] = points as [number, number];
  const ar = Math.floor(a / ctx.n);
  const ac = a % ctx.n;
  const br = Math.floor(b / ctx.n);
  const bc = b % ctx.n;
  const span = Math.max(Math.abs(ar - br), Math.abs(ac - bc));
  return span === 5 ? 1 : 2;
}

/** True if (r,c) — already holding a black stone — forms a straight four in this direction. */
function isStraightFour(ctx: Ctx, r: number, c: number, dr: number, dc: number): boolean {
  const points = fivePoints(ctx, r, c, dr, dc);
  if (points.length !== 2) return false;
  const [a, b] = points as [number, number];
  const span = Math.max(
    Math.abs(Math.floor(a / ctx.n) - Math.floor(b / ctx.n)),
    Math.abs((a % ctx.n) - (b % ctx.n)),
  );
  return span === 5;
}

/** True if the black stone at (r,c) makes a (real) three in this direction. */
function isThreeInDirection(
  ctx: Ctx,
  r: number,
  c: number,
  dr: number,
  dc: number,
  depth: number,
): boolean {
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const rr = r + dr * k;
    const cc = c + dc * k;
    if (!inside(ctx.n, rr, cc)) continue;
    const i = rr * ctx.n + cc;
    if (ctx.board[i] !== 0) continue;
    ctx.board[i] = BLACK;
    const straight = isStraightFour(ctx, rr, cc, dr, dc) && runIncludes(ctx, rr, cc, dr, dc, r, c);
    ctx.board[i] = 0;
    // The point that makes the straight four must itself be playable for Black.
    if (straight && !forbiddenAt(ctx, rr, cc, depth + 1)) return true;
  }
  return false;
}

function forbiddenAt(ctx: Ctx, r: number, c: number, depth: number): boolean {
  const i = r * ctx.n + c;
  if (ctx.board[i] !== 0) return false;
  if (depth > 4) return false;
  ctx.board[i] = BLACK;
  try {
    let five = false;
    let overline = false;
    for (const [dr, dc] of DIRS) {
      const len = runLength(ctx, r, c, dr, dc);
      if (len === 5) five = true;
      if (len >= 6) overline = true;
    }
    if (five) return false;
    if (overline) return true;
    let fours = 0;
    for (const [dr, dc] of DIRS) fours += foursInDirection(ctx, r, c, dr, dc);
    if (fours >= 2) return true;
    let threes = 0;
    for (const [dr, dc] of DIRS) {
      if (foursInDirection(ctx, r, c, dr, dc) > 0) continue;
      if (isThreeInDirection(ctx, r, c, dr, dc, depth)) threes++;
    }
    return threes >= 2;
  } finally {
    ctx.board[i] = 0;
  }
}

/**
 * Fast path: every forbidden shape (3-3, 4-4, overline) needs at least four other black stones on
 * the four lines through the point, within four steps.
 */
function enoughBlackNearby(board: ArrayLike<number>, n: number, index: number): boolean {
  const r = Math.floor(index / n);
  const c = index % n;
  let count = 0;
  for (const [dr, dc] of DIRS) {
    for (let k = -4; k <= 4; k++) {
      if (k === 0) continue;
      const rr = r + dr * k;
      const cc = c + dc * k;
      if (inside(n, rr, cc) && board[rr * n + cc] === BLACK && ++count >= 4) return true;
    }
  }
  return false;
}

export type ForbiddenReason = 'overline' | 'double-four' | 'double-three';

/** Whether Black may not play `index` on this board (the board is not modified). */
export function isForbiddenForBlack(
  board: ArrayLike<number>,
  size: number,
  index: number,
): boolean {
  if (board[index] !== 0 || !enoughBlackNearby(board, size, index)) return false;
  const ctx: Ctx = { board: Array.from(board), n: size };
  return forbiddenAt(ctx, Math.floor(index / size), index % size, 0);
}

/** Why a point is forbidden (for UI explanations), or null. */
export function forbiddenReason(
  board: ArrayLike<number>,
  size: number,
  index: number,
): ForbiddenReason | null {
  const ctx: Ctx = { board: Array.from(board), n: size };
  const r = Math.floor(index / size);
  const c = index % size;
  if (ctx.board[index] !== 0 || !forbiddenAt(ctx, r, c, 0)) return null;
  ctx.board[index] = BLACK;
  if (DIRS.some(([dr, dc]) => runLength(ctx, r, c, dr, dc) >= 6)) return 'overline';
  const fours = DIRS.reduce((n, [dr, dc]) => n + foursInDirection(ctx, r, c, dr, dc), 0);
  return fours >= 2 ? 'double-four' : 'double-three';
}

/** Whether a black stone just placed at `index` completes exactly five. */
export function blackExactFive(
  board: ArrayLike<number>,
  size: number,
  index: number,
): number[] | null {
  const ctx: Ctx = { board: Array.from(board), n: size };
  const r = Math.floor(index / size);
  const c = index % size;
  for (const [dr, dc] of DIRS) {
    if (runLength(ctx, r, c, dr, dc) !== 5) continue;
    const line = [index];
    for (const s of [1, -1]) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (inside(size, rr, cc) && ctx.board[rr * size + cc] === BLACK) {
        line.push(rr * size + cc);
        rr += dr * s;
        cc += dc * s;
      }
    }
    return line.sort((a, b) => a - b);
  }
  return null;
}
