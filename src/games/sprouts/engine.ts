/**
 * Sprouts, drawn on a fine square grid so every curve is real geometry. A curve is a 4-connected
 * path of cells from one spot to another (or back to the same spot). Curves may not cross or touch
 * other curves' cells, and may not pass through spots or the cells reserved around a living spot
 * (its free neighbors), so every spot keeps access to the regions around it — the grid version of
 * "a curve may pass close to a spot without blocking it". A new spot is placed on the curve, on
 * the most central cell that has free room beside it (a spot squeezed between curves on both
 * sides cannot be used again — the one way this grid variant differs from pencil Sprouts). A spot can have at most three curve ends (a loop counts twice), so starting
 * spots have three lives and new spots one. The player who cannot draw a curve loses.
 *
 * Regions are the connected areas of free cells; two spots can be joined exactly when they both
 * reach the same region (a spot reaches a region through one of its reserved cells), and a loop
 * needs two of its own reserved cells in the same region.
 *
 * Actions: "c0.c1.….ck" — the cells of the curve from spot to spot (cells are row·W + col).
 */
import { IllegalActionError } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import { isRecord } from '../../core/persistence/versioned';

export const W = 35;
export const H = 35;
export const MIN_SPOTS = 3;
export const MAX_SPOTS = 5;

export interface Spot {
  cell: number;
  lives: number;
}

export interface SproutsState {
  spotCount: number;
  spots: Spot[];
  /** Cells of every curve drawn (endpoints included), in order. */
  curves: number[][];
  first: 0 | 1;
  toMove: 0 | 1;
  history: string[];
  result: { winner: 0 | 1 } | null;
}

/** Cell contents, rebuilt from the state: 0 free, 1 curve, 2 spot, 3 reserved (owner in `owner`). */
export interface Grid {
  kind: Uint8Array;
  owner: Int16Array;
}

export const neighbors = (p: number): number[] => {
  const r = Math.floor(p / W);
  const c = p % W;
  const out: number[] = [];
  if (r > 0) out.push(p - W);
  if (r < H - 1) out.push(p + W);
  if (c > 0) out.push(p - 1);
  if (c < W - 1) out.push(p + 1);
  return out;
};

/** Starting spots evenly spaced on a circle around the center. */
export function startSpots(n: number): Spot[] {
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const radius = 8;
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = Math.round(cy + radius * Math.sin(angle));
    const c = Math.round(cx + radius * Math.cos(angle));
    return { cell: r * W + c, lives: 3 };
  });
}

export function createSproutsState(spotCount: number, first: 0 | 1 = 0): SproutsState {
  return {
    spotCount,
    spots: startSpots(spotCount),
    curves: [],
    first,
    toMove: first,
    history: [],
    result: null,
  };
}

export const spotCountFor = (seed: number) => new Rng(seed).range(MIN_SPOTS, MAX_SPOTS);

export function buildGrid(s: Pick<SproutsState, 'spots' | 'curves'>): Grid {
  const kind = new Uint8Array(W * H);
  const owner = new Int16Array(W * H).fill(-1);
  for (const curve of s.curves) for (const p of curve) kind[p] = 1;
  s.spots.forEach((spot, i) => {
    kind[spot.cell] = 2;
    owner[spot.cell] = i;
  });
  s.spots.forEach((spot, i) => {
    // Only spots that can still be used need room around them.
    if (spot.lives < 1) return;
    for (const q of neighbors(spot.cell))
      if (kind[q] === 0) {
        kind[q] = 3;
        owner[q] = i;
      }
  });
  return { kind, owner };
}

/** Why a drawn path is not a legal curve, or null when it is. */
export function curveProblem(s: SproutsState, g: Grid, path: readonly number[]): string | null {
  if (path.length < 3) return 'short';
  const a = g.kind[path[0]!] === 2 ? g.owner[path[0]!]! : -1;
  const b = g.kind[path[path.length - 1]!] === 2 ? g.owner[path[path.length - 1]!]! : -1;
  if (a < 0 || b < 0) return 'ends';
  const lives = s.spots.map((x) => x.lives);
  lives[a]!--;
  lives[b]!--;
  if (lives[a]! < 0 || lives[b]! < 0) return 'lives';
  const seen = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const p = path[i]!;
    if (!Number.isInteger(p) || p < 0 || p >= W * H) return 'cells';
    if (i > 0 && !neighbors(path[i - 1]!).includes(p)) return 'gap';
    if (i === 0 || i === path.length - 1) continue;
    if (seen.has(p)) return 'self';
    seen.add(p);
    const k = g.kind[p];
    if (k === 1) return 'crosses';
    if (k === 2) return 'spot';
    if (k === 3) {
      const o = g.owner[p];
      // Reserved cells may only be the first or last step, next to their own spot.
      const ok = (i === 1 && o === a) || (i === path.length - 2 && o === b);
      if (!ok) return 'reserved';
    }
  }
  // A loop must leave and come back on two different sides.
  if (a === b && path[1] === path[path.length - 2]) return 'self';
  return null;
}

/** Free cells (not reserved) grouped into regions: region id per cell, −1 elsewhere. */
export function regions(g: Grid): Int32Array {
  const id = new Int32Array(W * H).fill(-1);
  let next = 0;
  const stack: number[] = [];
  for (let p = 0; p < W * H; p++) {
    if (g.kind[p] !== 0 || id[p] !== -1) continue;
    id[p] = next;
    stack.push(p);
    while (stack.length) {
      const q = stack.pop()!;
      for (const n of neighbors(q))
        if (g.kind[n] === 0 && id[n] === -1) {
          id[n] = next;
          stack.push(n);
        }
    }
    next++;
  }
  return id;
}

/**
 * Pairs of spots (a ≤ b) that can be joined, as [a, b, region] — region −1 means the two spots'
 * reserved cells touch directly. A loop (a = b) needs two reserved cells reaching the region.
 */
export function joinable(s: SproutsState, g: Grid = buildGrid(s)): [number, number, number][] {
  const id = regions(g);
  const reach = s.spots.map(() => new Map<number, number>()); // region → reserved cells reaching it
  const touching = new Set<string>();
  for (let p = 0; p < W * H; p++) {
    if (g.kind[p] !== 3) continue;
    const o = g.owner[p]!;
    const seenHere = new Set<number>();
    for (const n of neighbors(p)) {
      if (g.kind[n] === 0 && !seenHere.has(id[n]!)) {
        seenHere.add(id[n]!);
        reach[o]!.set(id[n]!, (reach[o]!.get(id[n]!) ?? 0) + 1);
      }
      if ((g.kind[n] === 3 || g.kind[n] === 2) && g.owner[n] !== o) {
        const [x, y] = [Math.min(o, g.owner[n]!), Math.max(o, g.owner[n]!)];
        touching.add(`${x},${y}`);
      }
    }
  }
  const out: [number, number, number][] = [];
  const n = s.spots.length;
  for (let a = 0; a < n; a++) {
    if (s.spots[a]!.lives < 1) continue;
    if (s.spots[a]!.lives >= 2)
      for (const [region, count] of reach[a]!) if (count >= 2) out.push([a, a, region]);
    for (let b = a + 1; b < n; b++) {
      if (s.spots[b]!.lives < 1) continue;
      for (const region of reach[a]!.keys()) if (reach[b]!.has(region)) out.push([a, b, region]);
      if (touching.has(`${a},${b}`)) out.push([a, b, -1]);
    }
  }
  return out;
}

export const hasMove = (s: SproutsState, g?: Grid) => joinable(s, g).length > 0;

/**
 * Where the new spot goes. A spot on a curve borders the regions on both sides of it, so the best
 * cell is on a straight stretch (previous and next cells opposite each other) with a free cell on
 * each side; failing that, any inner cell with some free room; failing that, the middle. The most
 * central qualifying cell wins.
 */
export function newSpotCell(g: Grid, path: readonly number[]): number {
  const mid = (path.length - 1) / 2;
  const onPath = new Set(path);
  let best = -1;
  let bestKey = -Infinity;
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i]!;
    const sides = neighbors(p).filter((q) => !onPath.has(q));
    const free = sides.filter((q) => g.kind[q] === 0).length;
    const straight = path[i - 1]! - p === p - path[i + 1]!;
    const quality = straight && free === 2 ? 2 : free > 0 ? 1 : 0;
    const key = quality * 1000 - Math.abs(i - mid);
    if (key > bestKey) {
      bestKey = key;
      best = p;
    }
  }
  return best;
}

export function applySproutsAction(s: SproutsState, a: string): SproutsState {
  if (s.result) throw new IllegalActionError('The game is over');
  const path = a.split('.').map(Number);
  const g = buildGrid(s);
  const problem = curveProblem(s, g, path);
  if (problem) throw new IllegalActionError(`Illegal curve (${problem})`);
  const spots = s.spots.map((x) => ({ ...x }));
  spots[g.owner[path[0]!]!]!.lives--;
  spots[g.owner[path[path.length - 1]!]!]!.lives--;
  const middle = newSpotCell(g, path);
  // The new spot has two curve ends already: one life left.
  spots.push({ cell: middle, lives: 1 });
  const curves = [...s.curves, path];
  const me = s.toMove;
  const toMove = (1 - me) as 0 | 1;
  const next: SproutsState = {
    ...s,
    spots,
    curves,
    toMove,
    history: [...s.history, a],
    result: null,
  };
  if (!hasMove(next)) next.result = { winner: me };
  return next;
}

export function replaySprouts(
  spotCount: number,
  first: 0 | 1,
  history: readonly string[],
): SproutsState {
  return history.reduce((s, a) => applySproutsAction(s, a), createSproutsState(spotCount, first));
}

export function isValidSproutsState(data: unknown): data is SproutsState {
  if (!isRecord(data) || !Array.isArray(data.history)) return false;
  const n = data.spotCount;
  if (typeof n !== 'number' || n < MIN_SPOTS || n > MAX_SPOTS) return false;
  if (data.first !== 0 && data.first !== 1) return false;
  if (!data.history.every((a) => typeof a === 'string')) return false;
  try {
    const replayed = replaySprouts(n, data.first, data.history as string[]);
    return JSON.stringify(replayed) === JSON.stringify(data);
  } catch {
    return false;
  }
}
