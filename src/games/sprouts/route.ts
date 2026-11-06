/**
 * Curve routing for the computer and for tap-to-connect: a shortest path (Dijkstra) from one spot
 * to another through a region, with optional random cell costs so repeated calls find different
 * curves (going around obstacles on either side), and a small penalty for hugging other curves so
 * new spots keep room beside them.
 */
import type { Rng } from '../../core/game-engine/random';
import { H, W, buildGrid, neighbors, regions, type Grid, type SproutsState } from './engine';

class MinHeap {
  private items: [number, number][] = [];
  get size() {
    return this.items.length;
  }
  push(cost: number, cell: number) {
    const a = this.items;
    a.push([cost, cell]);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent]![0] <= a[i]![0]) break;
      [a[parent], a[i]] = [a[i]!, a[parent]!];
      i = parent;
    }
  }
  pop(): [number, number] {
    const a = this.items;
    const top = a[0]!;
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l]![0] < a[m]![0]) m = l;
        if (r < a.length && a[r]![0] < a[m]![0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i]!, a[m]!];
        i = m;
      }
    }
    return top;
  }
}

/**
 * A legal curve from spot `a` to spot `b` (equal for a loop) through `region` (−1: the spots'
 * reserved cells touch directly), or null when there is none.
 */
export function route(
  s: SproutsState,
  a: number,
  b: number,
  region: number,
  rng?: Rng,
  g: Grid = buildGrid(s),
  ids: Int32Array = regions(g),
): number[] | null {
  const A = s.spots[a]!.cell;
  const B = s.spots[b]!.cell;
  const reservedOf = (spot: number) =>
    neighbors(s.spots[spot]!.cell).filter((q) => g.kind[q] === 3 && g.owner[q] === spot);
  if (region < 0) {
    for (const ra of reservedOf(a)) {
      if (neighbors(ra).includes(B)) return [A, ra, B];
      for (const rb of reservedOf(b)) if (neighbors(ra).includes(rb)) return [A, ra, rb, B];
    }
    for (const rb of reservedOf(b)) if (neighbors(rb).includes(A)) return [A, rb, B];
    return null;
  }
  const touches = (r: number) => neighbors(r).some((q) => g.kind[q] === 0 && ids[q] === region);
  const starts = reservedOf(a).filter(touches);
  const ends = new Set(reservedOf(b).filter(touches));
  if (!starts.length || !ends.size) return null;
  // Keep clear of curves, spots and their reserved cells so corridors and new spots stay roomy.
  const hug = (p: number) => neighbors(p).reduce((n, q) => n + (g.kind[q] ? 3 : 0), 0);
  const order = rng ? rng.shuffle(starts) : starts;
  for (const start of order) {
    const goals = new Set(ends);
    goals.delete(start); // a loop must come back on another side
    if (!goals.size) continue;
    const dist = new Float64Array(W * H).fill(Infinity);
    const prev = new Int32Array(W * H).fill(-1);
    const heap = new MinHeap();
    dist[start] = 0;
    heap.push(0, start);
    let found = -1;
    while (heap.size) {
      const [d, p] = heap.pop();
      if (d > dist[p]!) continue;
      if (p !== start && goals.has(p)) {
        found = p;
        break;
      }
      for (const q of neighbors(p)) {
        const free = g.kind[q] === 0 && ids[q] === region;
        if (!free && !goals.has(q)) continue;
        const step = 1 + hug(q) + (rng ? rng.float() * 3 : 0);
        if (d + step < dist[q]!) {
          dist[q] = d + step;
          prev[q] = p;
          heap.push(d + step, q);
        }
      }
    }
    if (found < 0) continue;
    const cells: number[] = [];
    for (let p = found; p !== -1; p = prev[p]!) cells.push(p);
    cells.reverse();
    return [A, ...cells, B];
  }
  return null;
}
