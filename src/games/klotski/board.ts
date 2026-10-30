/**
 * The sliding-block tray: 4 columns × 5 rows holding one 2×2 block, 1×2 upright blocks, 2×1 flat
 * blocks and 1×1 squares, with two free cells. A position is a 20-character key read row by row:
 * each block writes a capital letter in its top-left cell and a small one in the rest (A/a big,
 * V/v upright, H/h flat), S is a square and `.` a free cell, so identical blocks are interchangeable
 * and every position has one key. The puzzle is solved when the big block sits at the bottom
 * middle, over the exit.
 */
export const W = 4;
export const H = 5;
/** Top-left cell of the big block when it is over the exit. */
export const GOAL = 3 * W + 1;

export interface Block {
  /** Top-left cell. */
  at: number;
  w: number;
  h: number;
  kind: 'A' | 'V' | 'H' | 'S';
}

const SIZE: Record<Block['kind'], [number, number]> = {
  A: [2, 2],
  V: [1, 2],
  H: [2, 1],
  S: [1, 1],
};

export const keyOf = (board: readonly string[]) => board.join('');
export const parse = (key: string): string[] => [...key];
export const isSolvedKey = (key: string) => key[GOAL] === 'A';

export function blocksOf(board: readonly string[]): Block[] {
  const out: Block[] = [];
  board.forEach((c, at) => {
    if (c === 'A' || c === 'V' || c === 'H' || c === 'S') {
      const [w, h] = SIZE[c];
      out.push({ at, w, h, kind: c });
    }
  });
  return out;
}

export const cellsOf = (b: { at: number; w: number; h: number }, at = b.at) => {
  const cells: number[] = [];
  for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) cells.push(at + dy * W + dx);
  return cells;
};

/** Writes block `b` at `at` (its old cells must be cleared first). */
function paint(board: string[], b: Block, at: number) {
  cellsOf(b, at).forEach(
    (c, i) => (board[c] = b.kind === 'S' ? 'S' : i === 0 ? b.kind : b.kind.toLowerCase()),
  );
}

/** Whether block `b` fits with its top-left at `at`, ignoring its own cells. */
export function fits(board: readonly string[], b: Block, at: number): boolean {
  const x = at % W;
  const y = Math.floor(at / W);
  if (at < 0 || x + b.w > W || y + b.h > H) return false;
  const own = new Set(cellsOf(b));
  return cellsOf(b, at).every((c) => board[c] === '.' || own.has(c));
}

/** The board with block `b` moved to `at`. */
export function moveBlock(board: readonly string[], b: Block, at: number): string[] {
  const next = [...board];
  cellsOf(b).forEach((c) => (next[c] = '.'));
  paint(next, b, at);
  return next;
}

/** Cells the block's top-left can reach one step at a time through free cells (not its start). */
export function reach(board: readonly string[], b: Block): number[] {
  const seen = new Set([b.at]);
  const queue = [b.at];
  for (let q = 0; q < queue.length; q++) {
    const at = queue[q]!;
    const x = at % W;
    for (const [d, ok] of [
      [-W, true],
      [W, true],
      [-1, x > 0],
      [1, x < W - 1],
    ] as const) {
      const to = at + d;
      if (!ok || seen.has(to) || !fits(board, b, to)) continue;
      seen.add(to);
      queue.push(to);
    }
  }
  return [...seen].filter((at) => at !== b.at);
}

/** Every position one move away: one block moved any distance along any free path. */
export function movesFrom(
  board: readonly string[],
): { block: Block; to: number; board: string[] }[] {
  const out: { block: Block; to: number; board: string[] }[] = [];
  for (const b of blocksOf(board))
    for (const to of reach(board, b)) out.push({ block: b, to, board: moveBlock(board, b, to) });
  return out;
}
