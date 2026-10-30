/**
 * Snakes and Ladders on a 10×10 board numbered 1–100 in a boustrophedon from the bottom left.
 * Players start off the board (square 0) and move by the throw; the foot of a ladder carries a
 * token up to its top, the head of a snake down to its tail. Reaching 100 needs the exact throw:
 * a throw that would pass it leaves the token where it is. In the classic game each turn is one die
 * and there are no decisions; in the Choice variant each turn throws two dice and the player moves
 * by one of them, which makes it a game of judgement. Turns rotate between 2–4 players; the first
 * to reach 100 wins.
 */
export const SIZE = 100;

/** Ladders (foot → top) and snakes (head → tail) of this board's own layout. */
export const LADDERS: Record<number, number> = {
  3: 22,
  8: 30,
  21: 42,
  28: 76,
  36: 44,
  50: 67,
  58: 79,
  71: 92,
  80: 99,
};
export const SNAKES: Record<number, number> = {
  17: 7,
  33: 15,
  48: 26,
  62: 41,
  64: 60,
  74: 53,
  87: 57,
  93: 68,
  95: 75,
  97: 78,
};

/** Where a token ends after moving `d` from `from`: a throw past 100 does not move; then ladders and snakes. */
export function land(from: number, d: number): number {
  const to = from + d;
  if (to > SIZE) return from;
  return LADDERS[to] ?? SNAKES[to] ?? to;
}

/** Grid cell (row 0 at the top, column 0 at the left) of a square 1–100. */
export function cellOf(sq: number): [number, number] {
  const k = sq - 1;
  const rowFromBottom = Math.floor(k / 10);
  const inRow = k % 10;
  const col = rowFromBottom % 2 === 0 ? inRow : 9 - inRow;
  return [9 - rowFromBottom, col];
}

/**
 * Expected turns to reach 100 from each square when every turn throws two dice and the better one
 * is used, by value iteration: E(s) = 1 + average over the 36 throws of min over the two dice of
 * E(land(s, die)). Also returns the classic one-die expectation for comparison.
 */
export function expectedTurns(): { choice: number[]; classic: number[] } {
  const choice = new Array<number>(SIZE + 1).fill(0);
  const classic = new Array<number>(SIZE + 1).fill(0);
  for (let iter = 0; iter < 2000; iter++) {
    let delta = 0;
    for (let s = SIZE - 1; s >= 0; s--) {
      let sum = 0;
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++) sum += Math.min(choice[land(s, a)]!, choice[land(s, b)]!);
      const v = 1 + sum / 36;
      delta = Math.max(delta, Math.abs(v - choice[s]!));
      choice[s] = v;
      let one = 0;
      for (let a = 1; a <= 6; a++) one += classic[land(s, a)]!;
      const c = 1 + one / 6;
      delta = Math.max(delta, Math.abs(c - classic[s]!));
      classic[s] = c;
    }
    if (delta < 1e-9) break;
  }
  return { choice, classic };
}
