/**
 * Riichi tiles: 136 = 34 kinds × 4 copies; tile id t has kind t >> 2. Kinds follow the shared tile
 * faces: 0–8 dots (pin) 1–9, 9–17 bamboo (sou) 1–9, 18–26 characters (man) 1–9, 27–30 winds east,
 * south, west, north, 31 red dragon, 32 green dragon, 33 white dragon. Hands are often handled as
 * counts per kind (arrays of 34).
 */
export const KINDS = 34;
export const kindOf = (t: number) => t >> 2;
export const isHonor = (k: number) => k >= 27;
export const numOf = (k: number) => (k % 9) + 1;
export const suitOf = (k: number) => (k >= 27 ? 3 : Math.floor(k / 9));
export const isTerminal = (k: number) => k < 27 && (numOf(k) === 1 || numOf(k) === 9);
export const isYaochu = (k: number) => isHonor(k) || isTerminal(k);
export const isDragon = (k: number) => k >= 31;
export const isWind = (k: number) => k >= 27 && k <= 30;
export const EAST = 27;
export const YAOCHU = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

/** The dora shown by an indicator: the next tile in its suit, winds E→S→W→N→E, dragons white→green→red→white. */
export function doraOf(indicator: number): number {
  if (indicator < 27) return indicator - (indicator % 9) + (((indicator % 9) + 1) % 9);
  if (indicator <= 30) return 27 + ((indicator - 27 + 1) % 4);
  return indicator === 33 ? 32 : indicator === 32 ? 31 : 33;
}

export function countsOf(tiles: readonly number[]): number[] {
  const c = new Array<number>(KINDS).fill(0);
  for (const t of tiles) c[kindOf(t)]!++;
  return c;
}
