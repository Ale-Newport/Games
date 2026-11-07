import { describe, expect, it } from 'vitest';
import { plannerAction } from '../ai';
import { cells, kicks } from '../pieces';
import {
  CLASSIC,
  COLS,
  dropY,
  fits,
  gravity,
  MODERN,
  newBlocks,
  ROWS,
  stepBlocks,
  type Blocks,
} from '../sim';

const run = (rules: typeof MODERN, s: Blocks, actions: string[]) =>
  actions.reduce((g, a) => stepBlocks(rules, g, a), s);

describe('Falling blocks', () => {
  it('pieces rotate in their boxes; the modern rules have wall kicks', () => {
    // T pointing right: the stem column plus the right nub.
    expect(cells('T', 1).sort()).toEqual([
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 1],
    ]);
    expect(cells('O', 1).sort()).toEqual(cells('O', 0).sort());
    expect(kicks('T', 0, 1, true)).toHaveLength(5);
    expect(kicks('T', 0, 1, false)).toEqual([[0, 0]]);
  });

  it('the modern queue is a 7-bag; the classic one shows one piece', () => {
    const m = newBlocks(MODERN, 1);
    // The first six pieces come from one shuffled bag of seven: all different.
    const seen = new Set([m.piece!.kind, ...m.queue]);
    expect(seen.size).toBe(6);
    expect(m.queue).toHaveLength(5);
    expect(newBlocks(CLASSIC, 1).queue).toHaveLength(1);
  });

  it('moves on a press and auto-repeats when held; rotation needs a fresh press', () => {
    const s = newBlocks(MODERN, 2);
    const x0 = s.piece!.x;
    const once = stepBlocks(MODERN, s, 'L');
    expect(once.piece!.x).toBe(x0 - 1);
    const held = run(MODERN, once, new Array(14).fill('L'));
    expect(held.piece!.x).toBeLessThan(x0 - 2);
    const r1 = stepBlocks(MODERN, s, 'C');
    const r2 = stepBlocks(MODERN, r1, 'C');
    expect(r1.piece!.r).toBe(1);
    expect(r2.piece!.r).toBe(1);
  });

  it('hard drop locks at once; a full row clears and scores', () => {
    const s0 = newBlocks(MODERN, 3);
    // Fill the bottom row but for the four cells an I piece will land in.
    const board = [...s0.board];
    for (let x = 4; x < COLS; x++) board[(ROWS - 1) * COLS + x] = 'Z';
    const s: Blocks = { ...s0, board, piece: { kind: 'I', r: 0, x: 0, y: 0 } };
    const t = stepBlocks(MODERN, s, 'H');
    expect(t.piece).toBeNull();
    expect(t.lines).toBe(1);
    expect(t.score).toBeGreaterThanOrEqual(100);
    expect(t.clearing).toEqual([ROWS - 1]);
    const u = run(MODERN, t, new Array(25).fill('idle'));
    expect(u.board.slice((ROWS - 1) * COLS).every((c) => c === null)).toBe(true);
  });

  it('classic scoring is 40/100/300/1200 × (level + 1) and the classic gravity table is used', () => {
    expect(gravity(CLASSIC, 0)).toBe(48);
    expect(gravity(CLASSIC, 19)).toBe(2);
    expect(gravity(MODERN, 1)).toBe(60);
    const s0 = newBlocks(CLASSIC, 4, { startLevel: 5 });
    const board = [...s0.board];
    for (let y = ROWS - 4; y < ROWS; y++) for (let x = 1; x < COLS; x++) board[y * COLS + x] = 'J';
    const s: Blocks = { ...s0, board, piece: { kind: 'I', r: 1, x: -2, y: 0 } };
    expect(fits(board, s.piece!)).toBe(true);
    let t = s;
    for (let i = 0; i < 2000 && t.piece; i++) t = stepBlocks(CLASSIC, t, 'S');
    expect(t.lines).toBe(4);
    expect(t.score).toBe(1200 * 6 + (dropY(board, s.piece!) - 0));
  });

  it('the planner clears lines and keeps going', () => {
    let s = newBlocks(MODERN, 5, { goal: 40 });
    while (!s.over && s.steps < 60 * 120) s = stepBlocks(MODERN, s, plannerAction(MODERN, s));
    expect(s.won).toBe(true);
    let c = newBlocks(CLASSIC, 5);
    for (let i = 0; i < 60 * 90; i++) c = stepBlocks(CLASSIC, c, plannerAction(CLASSIC, c));
    expect(c.lines).toBeGreaterThan(10);
    expect(c.over).toBe(false);
  });
});
