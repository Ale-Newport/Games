/**
 * Shut the Box: tiles 1–9 start open. Each throw of two dice (or one die, if the player chooses,
 * once the open tiles add up to 6 or less) must be matched by shutting open tiles that add up to the
 * throw. When no set of open tiles matches, the turn is over and scores the sum of the tiles still
 * open; shutting every tile ("shutting the box") scores 0. In a game for 2–4 players each plays one
 * turn on a fresh box and the lowest score wins.
 *
 * Boxes are bitmasks of open tiles (bit t − 1 for tile t), 512 of them; the best play — the one that
 * minimizes the expected final score — is solved exactly by dynamic programming over them.
 */
export const ALL_OPEN = 0b111111111;

export const openTiles = (box: number) =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((t) => box & (1 << (t - 1)));
export const boxScore = (box: number) => openTiles(box).reduce((a, b) => a + b, 0);
export const oneDieAllowed = (box: number) => boxScore(box) <= 6;

/** Every way to shut open tiles adding up to `n`, as masks of the tiles shut. */
export function shutOptions(box: number, n: number): number[] {
  const out: number[] = [];
  const tiles = openTiles(box);
  const rec = (i: number, left: number, mask: number) => {
    if (left === 0) {
      out.push(mask);
      return;
    }
    for (let k = i; k < tiles.length; k++) {
      const t = tiles[k]!;
      if (t > left) break;
      rec(k + 1, left - t, mask | (1 << (t - 1)));
    }
  };
  rec(0, n, 0);
  return out;
}

const TWO_DICE: [number, number][] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => [
  s,
  (6 - Math.abs(7 - s)) / 36,
]);
const ONE_DIE: [number, number][] = [1, 2, 3, 4, 5, 6].map((s) => [s, 1 / 6]);

let table: { expect: Float64Array; useOne: Uint8Array } | null = null;

/** Expected final score from each box under best play, and whether one die is the better throw. */
export function solve() {
  if (table) return table;
  const expect = new Float64Array(512);
  const useOne = new Uint8Array(512);
  const value = (box: number, throws: [number, number][]) => {
    let e = 0;
    for (const [n, p] of throws) {
      let best = boxScore(box);
      for (const m of shutOptions(box, n)) best = Math.min(best, expect[box & ~m]!);
      e += p * best;
    }
    return e;
  };
  // Shutting tiles only removes bits, so boxes with fewer tiles are settled first.
  const order = [...Array(512).keys()].sort((a, b) => openTiles(a).length - openTiles(b).length);
  for (const box of order) {
    if (box === 0) continue;
    const two = value(box, TWO_DICE);
    if (oneDieAllowed(box)) {
      const one = value(box, ONE_DIE);
      expect[box] = Math.min(one, two);
      useOne[box] = one < two ? 1 : 0;
    } else expect[box] = two;
  }
  table = { expect, useOne };
  return table;
}

/** The best tiles to shut for a throw (the option that leaves the lowest expected score), or null. */
export function bestShut(box: number, n: number): number | null {
  const { expect } = solve();
  let best: number | null = null;
  let score = Infinity;
  for (const m of shutOptions(box, n)) {
    const v = expect[box & ~m]!;
    if (v < score) {
      score = v;
      best = m;
    }
  }
  return best;
}

/** The simple player's choice: shut the single tile if it is open, otherwise the highest tiles first. */
export function simpleShut(box: number, n: number): number | null {
  const options = shutOptions(box, n);
  if (!options.length) return null;
  const highest = (m: number) => Math.max(...openTiles(m));
  return options.reduce((a, b) => {
    const ka = openTiles(a).length;
    const kb = openTiles(b).length;
    if (ka !== kb) return ka < kb ? a : b;
    return highest(a) >= highest(b) ? a : b;
  });
}
