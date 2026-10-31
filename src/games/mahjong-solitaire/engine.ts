/**
 * Mahjong solitaire (tile matching): a layout of mahjong tiles stacked in layers; remove matching
 * pairs of free tiles until the layout is clear. A tile is free when no tile lies on it and its left
 * or right neighbour in the same layer is missing. Flowers match any flower and seasons any season;
 * every other tile matches its identical copies.
 *
 * Positions sit on a whole-tile grid (x, y, layer): a tile covers the one directly below it. Deals
 * are built solvable: pairs of positions that are free in the remaining layout are taken away one
 * at a time and given matching faces, so playing that order clears the board. A reshuffle (limited)
 * redeals the remaining faces among the remaining positions, again solvably.
 *
 * Actions: "pair:<i>,<j>" (two positions), "shuffle".
 */
import { nextUint32, seedRng, type RngState } from '../../core/game-engine/random';

export interface Slot {
  x: number;
  y: number;
  z: number;
}

export interface LayoutDef {
  id: string;
  slots: Slot[];
}

/** Rectangles of tiles, layer by layer: [x0, y0, cols, rows, z]. */
function build(id: string, rects: [number, number, number, number, number][]): LayoutDef {
  const slots: Slot[] = [];
  for (const [x0, y0, w, h, z] of rects)
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) slots.push({ x, y, z });
  return { id, slots };
}

/** An original stepped pyramid of 144 tiles: 72 + 40 + 16 + 12 + 4. */
export const PYRAMID = build('pyramid', [
  [0, 0, 12, 6, 0],
  [1, 1, 10, 4, 1],
  [2, 2, 8, 2, 2],
  [3, 2, 6, 2, 3],
  [5, 2, 2, 2, 4],
]);

/** A quicker cross of 84 tiles: two crossing bars with a raised centre. */
export const CROSSROADS = build('crossroads', [
  [0, 2, 10, 2, 0],
  [3, 0, 4, 2, 0],
  [3, 4, 4, 2, 0],
  [1, 2, 8, 2, 1],
  [3, 1, 4, 1, 1],
  [3, 4, 4, 1, 1],
  [2, 2, 6, 2, 2],
  [3, 1, 4, 1, 2],
  [3, 4, 4, 1, 2],
  [4, 2, 2, 2, 3],
]);

export const LAYOUTS: LayoutDef[] = [CROSSROADS, PYRAMID];
export const layoutById = (id: string) => LAYOUTS.find((l) => l.id === id) ?? CROSSROADS;

/**
 * Faces 0–41: 0–8 dots 1–9, 9–17 bamboo 1–9, 18–26 characters 1–9, 27–30 winds (E S W N),
 * 31–33 dragons (red, green, white), 34–37 flowers, 38–41 seasons.
 */
export const FACE_COUNT = 42;
export const matchGroup = (f: number) => (f >= 38 ? 38 : f >= 34 ? 34 : f);
export const matches = (a: number, b: number) => matchGroup(a) === matchGroup(b);

/** The faces of a full set (144), or of `n` tiles taken as whole groups of four. */
function faceSet(n: number, rng: RngState): [number[], RngState] {
  const groups: number[][] = [];
  for (let f = 0; f < 34; f++) groups.push([f, f, f, f]);
  groups.push([34, 35, 36, 37], [38, 39, 40, 41]);
  let r = rng;
  // Shuffle the groups, then keep as many as the layout needs.
  for (let i = groups.length - 1; i > 0; i--) {
    const [x, next] = nextUint32(r);
    r = next;
    const j = x % (i + 1);
    [groups[i], groups[j]] = [groups[j]!, groups[i]!];
  }
  return [groups.slice(0, n / 4).flat(), r];
}

export interface MahjongGame {
  layout: string;
  seed: number;
  rng: RngState;
  /** The face at each slot, or −1 once removed. */
  faces: number[];
  shuffles: number;
  phase: 'play' | 'won' | 'stuck';
  history: string[];
}

export const SHUFFLES = 3;

/** Whether slot i is free among the slots still `present`. */
export function isFree(def: LayoutDef, present: (i: number) => boolean, i: number): boolean {
  const s = def.slots[i]!;
  let left = false;
  let right = false;
  for (let j = 0; j < def.slots.length; j++) {
    if (j === i || !present(j)) continue;
    const o = def.slots[j]!;
    if (o.z === s.z + 1 && o.x === s.x && o.y === s.y) return false;
    if (o.z === s.z && o.y === s.y) {
      if (o.x === s.x - 1) left = true;
      if (o.x === s.x + 1) right = true;
    }
  }
  return !(left && right);
}

export function freeSlots(g: MahjongGame): number[] {
  const def = layoutById(g.layout);
  const present = (i: number) => g.faces[i]! >= 0;
  return g.faces.flatMap((f, i) => (f >= 0 && isFree(def, present, i) ? [i] : []));
}

/**
 * Deals `faces` onto the `slots` (indices into the layout) so that the deal can be cleared: pairs
 * of slots free in what remains are taken away in turn and given a matching pair. Retries when the
 * removal order gets stuck; returns null after too many tries.
 */
function solvableDeal(
  def: LayoutDef,
  slots: number[],
  faces: number[],
  rng: RngState,
): [Map<number, number>, RngState, [number, number][]] | null {
  let r = rng;
  const rand = (n: number) => {
    const [x, next] = nextUint32(r);
    r = next;
    return x % n;
  };
  // Pairs of matching faces, shuffled.
  const byGroup = new Map<number, number[]>();
  for (const f of faces) byGroup.set(matchGroup(f), [...(byGroup.get(matchGroup(f)) ?? []), f]);
  for (let attempt = 0; attempt < 200; attempt++) {
    const pairs: [number, number][] = [];
    for (const fs of byGroup.values())
      for (let k = 0; k + 1 < fs.length; k += 2) pairs.push([fs[k]!, fs[k + 1]!]);
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [pairs[i], pairs[j]] = [pairs[j]!, pairs[i]!];
    }
    const left = new Set(slots);
    const out = new Map<number, number>();
    const order: [number, number][] = [];
    let ok = true;
    for (const [fa, fb] of pairs) {
      const free = [...left].filter((i) => isFree(def, (j) => left.has(j), i));
      if (free.length < 2) {
        ok = false;
        break;
      }
      // Prefer the highest layers so that stacks do not end up holding a pair alone.
      free.sort((a, b) => def.slots[b]!.z - def.slots[a]!.z);
      const top = free.slice(0, Math.max(2, Math.ceil(free.length / 2)));
      const a = top.splice(rand(top.length), 1)[0]!;
      // Both tiles must be free together (in play they leave at once).
      const rest = free.filter((i) => i !== a);
      const b = rest[rand(rest.length)]!;
      left.delete(a);
      left.delete(b);
      out.set(a, fa);
      out.set(b, fb);
      order.push(a < b ? [a, b] : [b, a]);
    }
    if (ok) return [out, r, order];
  }
  return null;
}

/** The removal order a deal was built from (a solution), for tests. */
export function dealSolution(layoutId: string, seed: number): [number, number][] {
  const def = layoutById(layoutId);
  const [faces, rng] = faceSet(def.slots.length, seedRng(seed >>> 0));
  return solvableDeal(
    def,
    def.slots.map((_, i) => i),
    faces,
    rng,
  )![2];
}

export function newMahjong(layoutId: string, seed: number): MahjongGame {
  const def = layoutById(layoutId);
  let rng = seedRng(seed >>> 0);
  const [faces, r1] = faceSet(def.slots.length, rng);
  rng = r1;
  const dealt = solvableDeal(
    def,
    def.slots.map((_, i) => i),
    faces,
    rng,
  );
  if (!dealt) throw new Error('Could not deal the layout');
  const [map, r2] = dealt;
  return {
    layout: def.id,
    seed: seed >>> 0,
    rng: r2,
    faces: def.slots.map((_, i) => map.get(i)!),
    shuffles: SHUFFLES,
    phase: 'play',
    history: [],
  };
}

/** Every pair of free matching tiles, as [i, j] with i < j. */
export function freePairs(g: MahjongGame): [number, number][] {
  const free = freeSlots(g);
  const out: [number, number][] = [];
  for (let a = 0; a < free.length; a++)
    for (let b = a + 1; b < free.length; b++)
      if (matches(g.faces[free[a]!]!, g.faces[free[b]!]!)) out.push([free[a]!, free[b]!]);
  return out;
}

export function legalActions(g: MahjongGame): string[] {
  if (g.phase !== 'play') return [];
  const out = freePairs(g).map(([i, j]) => `pair:${i},${j}`);
  if (g.shuffles > 0) out.push('shuffle');
  return out;
}

const remaining = (g: MahjongGame) => g.faces.filter((f) => f >= 0).length;

function settle(g: MahjongGame): MahjongGame {
  if (remaining(g) === 0) return { ...g, phase: 'won' };
  if (!freePairs(g).length && g.shuffles === 0) return { ...g, phase: 'stuck' };
  return g;
}

export function act(g: MahjongGame, action: string): MahjongGame {
  if (!legalActions(g).includes(action)) return g;
  const history = [...g.history, action];
  if (action === 'shuffle') {
    const def = layoutById(g.layout);
    const slots = g.faces.flatMap((f, i) => (f >= 0 ? [i] : []));
    const dealt = solvableDeal(
      def,
      slots,
      slots.map((i) => g.faces[i]!),
      g.rng,
    );
    if (!dealt) return settle({ ...g, shuffles: g.shuffles - 1, history });
    const [map, rng] = dealt;
    return settle({
      ...g,
      rng,
      faces: g.faces.map((f, i) => (f >= 0 ? map.get(i)! : f)),
      shuffles: g.shuffles - 1,
      history,
    });
  }
  const [i, j] = action.slice(5).split(',').map(Number);
  return settle({ ...g, faces: g.faces.map((f, k) => (k === i || k === j ? -1 : f)), history });
}

export const tilesLeft = remaining;

export function isValidMahjong(d: unknown): d is MahjongGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as MahjongGame;
  if (!LAYOUTS.some((l) => l.id === s.layout) || !Number.isInteger(s.seed) || s.seed < 0)
    return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newMahjong(s.layout, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.faces, g.shuffles, g.phase, g.rng]) ===
    JSON.stringify([s.faces, s.shuffles, s.phase, s.rng])
  );
}
