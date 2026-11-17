/**
 * The duel bot. For the current piece (and, from medium up, the held or next piece) it tries every
 * rotation and column reachable by rotating at the spawn height and sliding, scores the resulting
 * board and keys the best placement in: hold, rotate, tap sideways, hard drop. While its stack is
 * low it builds for multi-line clears around one deep well; when the stack gets high it switches to
 * pure survival weights. Lower levels think longer before each piece and sometimes take a worse
 * placement.
 */
import { evaluate } from '../shared/blocks/ai';
import { boxSize, cells, type Kind } from '../shared/blocks/pieces';
import {
  COLS,
  dropY,
  fits,
  HIDDEN,
  ROWS,
  type Blocks,
  type Cell,
  type Piece,
} from '../shared/blocks/sim';

export type BotLevel = 'easy' | 'medium' | 'hard' | 'expert';
export const BOT_LEVELS: BotLevel[] = ['easy', 'medium', 'hard', 'expert'];

/** Steps the bot waits after a piece appears, how often it takes a worse placement, whether it uses hold. */
export const BOT: Record<BotLevel, { think: number; slip: number; hold: boolean }> = {
  easy: { think: 50, slip: 0.15, hold: false },
  medium: { think: 26, slip: 0.06, hold: true },
  hard: { think: 12, slip: 0.02, hold: true },
  expert: { think: 4, slip: 0, hold: true },
};

const ATTACK_VALUE = [0, -4, 0, 3, 10];

/** Column heights (0 for empty). */
function heights(board: (Cell | null)[]): number[] {
  const out: number[] = [];
  for (let x = 0; x < COLS; x++) {
    let y = 0;
    while (y < ROWS && board[y * COLS + x] === null) y++;
    out.push(ROWS - y);
  }
  return out;
}

/** The board after placing p and clearing rows, and the rows cleared. */
function place(board: (Cell | null)[], p: Piece): [(Cell | null)[], number] {
  const b = [...board];
  for (const [cx, cy] of cells(p.kind, p.r)) {
    const y = p.y + cy;
    if (y >= 0) b[y * COLS + p.x + cx] = p.kind;
  }
  const full: number[] = [];
  for (let y = 0; y < ROWS; y++)
    if (b.slice(y * COLS, (y + 1) * COLS).every((c) => c !== null)) full.push(y);
  return [
    [
      ...new Array<Cell | null>(full.length * COLS).fill(null),
      ...b.filter((_, i) => !full.includes(Math.floor(i / COLS))),
    ],
    full.length,
  ];
}

/** The attacking evaluation used while the stack is low. */
export function attackScore(board: (Cell | null)[], p: Piece): number {
  const [after, lines] = place(board, p);
  const h = heights(after);
  let holes = 0;
  for (let x = 0; x < COLS; x++)
    for (let y = ROWS - h[x]!; y < ROWS; y++) if (after[y * COLS + x] === null) holes++;
  // One well (the lowest column) is welcome; other dips are not.
  const well = h.indexOf(Math.min(...h));
  let bump = 0;
  for (let x = 0; x < COLS - 1; x++)
    if (x !== well && x + 1 !== well) bump += Math.abs(h[x]! - h[x + 1]!);
  const others = h.filter((_, x) => x !== well);
  const wellDepth = Math.min(...others) - h[well]!;
  let lowerCells = 0;
  for (const [, cy] of cells(p.kind, p.r)) lowerCells += ROWS - (p.y + cy);
  const total = after.filter((c) => c !== null).length;
  return (
    ATTACK_VALUE[lines]! * 9 +
    (total === 0 ? 60 : 0) -
    holes * 9 -
    bump * 1.4 -
    Math.max(...others) * 0.6 -
    lowerCells * 0.15 +
    Math.min(wellDepth, 4) * 2.5
  );
}

function maxHeight(board: (Cell | null)[]): number {
  return Math.max(...heights(board));
}

interface Plan {
  hold: boolean;
  r: number;
  x: number;
}

function candidates(board: (Cell | null)[], kind: Kind): { r: number; x: number; v: number }[] {
  const start: Piece = { kind, r: 0, x: boxSize(kind) === 2 ? 4 : 3, y: 0 };
  const safe = maxHeight(board) < 11;
  const out: { r: number; x: number; v: number }[] = [];
  for (let r = 0; r < 4; r++) {
    if ((kind === 'O' && r > 0) || ((kind === 'I' || kind === 'S' || kind === 'Z') && r > 1))
      continue;
    const rotated = { ...start, r };
    if (!fits(board, rotated)) continue;
    for (let x = -2; x < COLS; x++) {
      const placed = { ...rotated, x };
      if (!fits(board, placed)) continue;
      const step = x < start.x ? -1 : 1;
      let ok = true;
      for (let xx = start.x; xx !== x; xx += step)
        if (!fits(board, { ...rotated, x: xx })) ok = false;
      if (!ok) continue;
      const landed = { ...placed, y: dropY(board, placed) };
      out.push({ r, x, v: safe ? attackScore(board, landed) : evaluate(board, landed) });
    }
  }
  return out.sort((a, b) => b.v - a.v);
}

const cache = new WeakMap<object, Map<string, Plan | null>>();

/** The placement to aim for (`slip` in [0, 1) picks a worse one when below the level's slip rate). */
export function plan(b: Blocks, level: BotLevel, slip: number): Plan | null {
  const p = b.piece;
  if (!p) return null;
  const useHold = BOT[level].hold && !b.holdUsed;
  const key = `${p.kind}${b.hold ?? '-'}${b.queue[0]}${useHold ? 'h' : ''}${slip < BOT[level].slip ? 's' : ''}`;
  const known = cache.get(b.board)?.get(key);
  if (known !== undefined) return known;
  const now = candidates(b.board, p.kind);
  let best: Plan | null = null;
  if (now.length) {
    // A slip takes the second or third choice, and only while the stack is low.
    const slipped = slip < BOT[level].slip && maxHeight(b.board) < 9;
    const pick = slipped
      ? now[Math.min(now.length - 1, 1 + (Math.floor(slip * 100) % 2))]!
      : now[0]!;
    best = { hold: false, r: pick.r, x: pick.x };
    if (useHold) {
      const other = b.hold ?? b.queue[0];
      if (other && other !== p.kind) {
        const alt = candidates(b.board, other)[0];
        if (alt && alt.v > now[0]!.v + 0.5) best = { hold: true, r: alt.r, x: alt.x };
      }
    }
  }
  if (!cache.has(b.board)) cache.set(b.board, new Map());
  cache.get(b.board)!.set(key, best);
  return best;
}

/** The keys for this step towards the plan (presses alternate with releases). */
export function botKeys(b: Blocks, level: BotLevel, slip: number): string {
  const p = b.piece;
  if (!p) return 'idle';
  const t = plan(b, level, slip);
  const tap = b.prev === '' || b.prev === 'idle';
  if (!tap) return 'idle';
  if (!t) return 'H';
  if (t.hold) return 'K';
  if (p.r !== t.r) {
    const d = (t.r - p.r + 4) % 4;
    return d === 2 ? 'F' : d === 3 ? 'A' : 'C';
  }
  if (p.x !== t.x) return t.x < p.x ? 'L' : 'R';
  return 'H';
}

/** How high the stack is, in visible rows. */
export function stackHeight(b: Blocks): number {
  return Math.min(ROWS - HIDDEN, maxHeight(b.board));
}
