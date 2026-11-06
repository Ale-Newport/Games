/**
 * Seeded, serializable pseudo-random number generation.
 *
 * Game states that need randomness store an `RngState` (four 32-bit integers) so states can be
 * cloned, serialized and replayed exactly. Never use Math.random() inside rules engines.
 */

export type RngState = readonly [number, number, number, number];

/** SplitMix32: expands a single seed into well-mixed 32-bit words. */
function splitMix32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
}

export function seedRng(seed: number): RngState {
  const next = splitMix32(Math.floor(seed) | 0);
  const state: [number, number, number, number] = [next(), next(), next(), next()];
  if (state.every((word) => word === 0)) state[0] = 1;
  return state;
}

/** xoshiro128**: returns a uint32 and the advanced state, without mutating the input. */
export function nextUint32(state: RngState): [number, RngState] {
  let [a, b, c, d] = state;
  const result = Math.imul(rotl(Math.imul(b, 5) >>> 0, 7), 9) >>> 0;
  const t = (b << 9) >>> 0;
  c = (c ^ a) >>> 0;
  d = (d ^ b) >>> 0;
  b = (b ^ c) >>> 0;
  a = (a ^ d) >>> 0;
  c = (c ^ t) >>> 0;
  d = rotl(d, 11);
  return [result, [a, b, c, d]];
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/**
 * Mutable convenience wrapper. Use `state` to persist it inside a game state and `Rng.from(state)`
 * to resume.
 */
export class Rng {
  private s: RngState;

  constructor(seedOrState: number | RngState) {
    this.s = typeof seedOrState === 'number' ? seedRng(seedOrState) : seedOrState;
  }

  static from(state: RngState): Rng {
    return new Rng(state);
  }

  get state(): RngState {
    return this.s;
  }

  uint32(): number {
    const [value, next] = nextUint32(this.s);
    this.s = next;
    return value;
  }

  /** Uniform float in [0, 1). */
  float(): number {
    return this.uint32() / 4294967296;
  }

  /** Uniform integer in [0, n). Uses rejection sampling to avoid modulo bias. */
  int(n: number): number {
    if (!Number.isInteger(n) || n <= 0)
      throw new RangeError(`Rng.int requires a positive integer, got ${n}`);
    const limit = Math.floor(4294967296 / n) * n;
    let value = this.uint32();
    while (value >= limit) value = this.uint32();
    return value % n;
  }

  /** Uniform integer in [min, max] inclusive. */
  range(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Rng.pick on empty array');
    return items[this.int(items.length)] as T;
  }

  /** Returns a shuffled copy (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
  }

  chance(probability: number): boolean {
    return this.float() < probability;
  }
}

/** A fresh, non-reproducible seed for interactive play (recorded so the game can be replayed). */
export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0] as number;
  }
  return Math.floor(Math.random() * 4294967296);
}
