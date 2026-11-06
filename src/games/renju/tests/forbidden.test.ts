import { describe, expect, it } from 'vitest';
import { blackExactFive, forbiddenReason, isForbiddenForBlack } from '../forbidden';

const N = 15;
/** Board from a picture placed at the top-left: '.' empty, 'X' black, 'O' white, '?' the tested empty point. */
function board(rows: string[]): { b: number[]; q: number } {
  const b = new Array<number>(N * N).fill(0);
  let q = -1;
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === 'X') b[r * N + c] = 1;
      if (ch === 'O') b[r * N + c] = 2;
      if (ch === '?') q = r * N + c;
    }),
  );
  return { b, q };
}

describe('Renju forbidden moves (hand-verified patterns)', () => {
  it('3-3: two open threes at once is forbidden', () => {
    const { b, q } = board([
      '...............',
      '...............',
      '.......X.......',
      '.......X.......',
      '.....XX?.......',
    ]);
    expect(forbiddenReason(b, N, q)).toBe('double-three');
  });

  it('a three that is blocked on one side does not count (no 3-3)', () => {
    const { b, q } = board([
      '...............',
      '.......O.......',
      '.......X.......',
      '.......X.......',
      '.....XX?.......',
    ]);
    expect(isForbiddenForBlack(b, N, q)).toBe(false);
  });

  it('4-4 across two lines is forbidden', () => {
    const { b, q } = board([
      '.......X.......',
      '.......X.......',
      '.......X.......',
      '....XXX?.......',
    ]);
    expect(forbiddenReason(b, N, q)).toBe('double-four');
  });

  it('4-4 inside one line (X.X?X.X) is forbidden', () => {
    // After the stone: X . X X X . X — filling either gap makes exactly five: two fours, one line.
    const { b, q } = board(['X.X?X.X........']);
    expect(forbiddenReason(b, N, q)).toBe('double-four');
  });

  it('a straight four counts as a single four', () => {
    // . X X X ? . with a vertical four elsewhere would be 4-4; a straight four alone is just one four.
    const { b, q } = board(['...............', '.XXX?..........']);
    expect(isForbiddenForBlack(b, N, q)).toBe(false);
  });

  it('4-3 (one four and one three) is allowed — it is the winning combination', () => {
    const { b, q } = board([
      '...............',
      '.......X.......',
      '.......X.......',
      '.......X.......',
      '.....XX?.......',
    ]);
    expect(isForbiddenForBlack(b, N, q)).toBe(false);
  });

  it('a "three" whose open extension would make an overline is fake (no 3-3)', () => {
    // Horizontal: X . . X X ? . . O — extending left needs the point next to the far X → six → no five.
    const real = board([
      '...............',
      '...............',
      '.......X.......',
      '.......X.......',
      '.....XX?.O.....',
    ]);
    expect(forbiddenReason(real.b, N, real.q)).toBe('double-three');
    const fake = board([
      '...............',
      '...............',
      '.......X.......',
      '.......X.......',
      '..X..XX?.O.....',
    ]);
    expect(isForbiddenForBlack(fake.b, N, fake.q)).toBe(false);
  });

  it('overline is forbidden; an exact five is allowed even together with a double four', () => {
    const over = board(['..XXX?XX.......']);
    expect(forbiddenReason(over.b, N, over.q)).toBe('overline');
    const five = board(['..XXX?X........']);
    expect(isForbiddenForBlack(five.b, N, five.q)).toBe(false);
    five.b[five.q] = 1;
    expect(blackExactFive(five.b, N, five.q)).toEqual([2, 3, 4, 5, 6]);
    const fivePlusFours = board([
      '..XXX?X........',
      '.....X.........',
      '.....X.........',
      '.....X.........',
    ]);
    expect(isForbiddenForBlack(fivePlusFours.b, N, fivePlusFours.q)).toBe(false);
  });

  it('occupied points are never reported as forbidden', () => {
    const { b } = board([
      '.......X.......',
      '.......X.......',
      '.......X.......',
      '....XXXX.......',
    ]);
    expect(isForbiddenForBlack(b, N, 3 * N + 7)).toBe(false);
  });
});
