import { describe, expect, it } from 'vitest';
import {
  AIMS,
  COLS,
  MAX_ROWS,
  aimerPolicy,
  cellX,
  landing,
  launch,
  advance,
  neighbours,
  newBubbles,
  present,
  rowLength,
  sprayerPolicy,
  stepBubbles,
  type BubbleAction,
  type Bubbles,
  type Cell,
} from '../sim';

const play = (s0: Bubbles, policy: (s: Bubbles) => BubbleAction, max: number) => {
  let s = s0;
  while (!s.over && s.steps < max) s = stepBubbles(s, policy(s));
  return s;
};
const STRAIGHT = (AIMS - 1) / 2;
/** A board with only the given bubbles ([row, col, colour]). */
const board = (cells: [number, number, number][], current = 0): Bubbles => {
  const s = newBubbles(1);
  const grid: Cell[][] = Array.from({ length: MAX_ROWS }, (_, r) =>
    Array<Cell>(rowLength(s, r)).fill(-1),
  );
  for (const [r, c, v] of cells) grid[r]![c] = v;
  return { ...s, grid, current, next: current };
};
/** Fires along an aim and runs until the bubble has stuck. */
const shoot = (s0: Bubbles, aim: number) => {
  let s = stepBubbles(s0, `shoot-${aim}`);
  while (s.flying) s = stepBubbles(s, 'idle');
  return s;
};

describe('Bubble Cannon rules', () => {
  it('level 1: five rows of four colours, and only colours on the board come up', () => {
    const s = newBubbles(1);
    expect(s.grid.filter((row) => row.some((v) => v >= 0))).toHaveLength(5);
    expect(s.colours).toBe(4);
    expect(present(s)).toContain(s.current);
    expect(present(s)).toContain(s.next);
    expect(s.grid[0]).toHaveLength(COLS);
    expect(s.grid[1]).toHaveLength(COLS - 1);
  });

  it('the honeycomb neighbours are mutual', () => {
    const s = newBubbles(2);
    for (let r = 0; r < MAX_ROWS; r++)
      for (let c = 0; c < rowLength(s, r); c++)
        for (const [nr, nc] of neighbours(s, r, c))
          expect(neighbours(s, nr, nc)).toContainEqual([r, c]);
  });

  it('a straight shot sticks under the bubble above it, where the AI predicts', () => {
    const s = board([[0, 4, 1]], 0);
    const predicted = landing(s, STRAIGHT);
    const t = shoot(s, STRAIGHT);
    expect(predicted).not.toBeNull();
    expect(t.grid[predicted![0]]![predicted![1]]).toBe(0);
    expect(predicted![0]).toBe(1);
    expect(t.events).toContain('stick');
    expect(t.shots).toBe(1);
  });

  it('bubbles bounce off the side walls', () => {
    let f = launch(0, 0);
    expect(f.vx).toBeLessThan(0);
    for (let k = 0; k < 20; k++) f = advance(board([]), f).f;
    expect(f.vx).toBeGreaterThan(0);
  });

  it('three of a colour pop; what hangs from them drops for double', () => {
    // Two reds on the top row, a blue hanging under them; a red fired up the middle joins them.
    const s = board([
      [0, 4, 0],
      [0, 5, 0],
      [1, 4, 1],
    ]);
    const t = shoot(s, landingAim(s, [0, 3]));
    expect(t.popped).toBe(3);
    expect(t.dropped).toBe(1);
    expect(t.score).toBe(3 * 10 + 20 + 1000);
    expect(t.events).toContain('clear');
  });

  it('shots that pop nothing bring a new row closer; at zero it pushes the honeycomb down', () => {
    let s = board([[0, 0, 1]], 0);
    s = { ...s, untilRow: 2 };
    s = shoot(s, STRAIGHT);
    expect(s.untilRow).toBe(1);
    const shift = s.shift;
    s = shoot(s, STRAIGHT + 10);
    expect(s.events).toContain('row');
    expect(s.shift).toBe(1 - shift);
    expect(s.grid[0]!.every((v) => v >= 0)).toBe(true);
    expect(s.untilRow).toBe(7);
  });

  it('a bubble below the line ends the game', () => {
    const cells: [number, number, number][] = [];
    // A chain down the left side holding up a full row just above the last one.
    for (let r = 0; r < MAX_ROWS - 2; r++) cells.push([r, 0, r % 2 ? 1 : 2]);
    for (let c = 0; c < rowLength(newBubbles(1), MAX_ROWS - 2); c++)
      cells.push([MAX_ROWS - 2, c, c % 2 ? 1 : 2]);
    const s = shoot({ ...board(cells, 3), untilRow: 9 }, STRAIGHT);
    expect(s.over).toBe(true);
  });

  it('clearing the board scores 1000 a level and brings a fuller one with more colours', () => {
    let s = shoot(
      board([
        [0, 4, 0],
        [0, 5, 0],
      ]),
      landingAim(
        board([
          [0, 4, 0],
          [0, 5, 0],
        ]),
        [0, 3],
      ),
    );
    expect(s.pause).toBeGreaterThan(0);
    while (s.pause) s = stepBubbles(s, 'idle');
    expect(s.level).toBe(2);
    expect(s.colours).toBe(5);
    expect(s.grid.filter((row) => row.some((v) => v >= 0))).toHaveLength(6);
  });

  it('swap exchanges the bubble in the cannon with the next one', () => {
    const s = { ...newBubbles(3), current: 0, next: 2 };
    const t = stepBubbles(s, 'swap');
    expect([t.current, t.next]).toEqual([2, 0]);
  });

  it('a finger aims, and the shot goes when it lifts', () => {
    let s = stepBubbles(newBubbles(4), 'aim-10');
    expect(s.aim).toBe(10);
    expect(s.touchAim).toBe(true);
    expect(s.flying).toBeNull();
    s = stepBubbles(s, 'fire');
    expect(s.flying).not.toBeNull();
    expect(s.touchAim).toBe(false);
  });

  it('the aimer clears level after level for five minutes; the sprayer is buried on level 1', () => {
    for (const seed of [1, 2, 3]) {
      const a = play(newBubbles(seed), aimerPolicy, 60 * 60 * 5);
      expect(a.over).toBe(false);
      expect(a.level).toBeGreaterThanOrEqual(4);
      const b = play(newBubbles(seed), sprayerPolicy, 60 * 60 * 5);
      expect(b.over).toBe(true);
      expect(b.level).toBe(1);
    }
  }, 60_000);

  it('replays exactly from the same seed and actions', () => {
    const a = play(newBubbles(9), aimerPolicy, 3000);
    const b = play(newBubbles(9), aimerPolicy, 3000);
    expect(b).toEqual(a);
  });
});

/** The aim whose shot lands in a given cell. */
function landingAim(s: Bubbles, cell: [number, number]): number {
  for (let k = 0; k < AIMS; k++) {
    const l = landing(s, k);
    if (l && l[0] === cell[0] && l[1] === cell[1]) return k;
  }
  throw new Error(`no aim reaches ${cell.join(',')} (x ${cellX(s, cell[0], cell[1])})`);
}
