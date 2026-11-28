/**
 * Tile Realm tiles. Each square tile's sides are split into three segments (12 “ports”, clockwise
 * from the north-west: north 0–2, east 3–5, south 6–8, west 9–11). Every feature of a tile — a
 * town, a road, a meadow or a shrine — owns some ports; a side is a town side when its three ports
 * belong to a town, a road side when its middle port is a road, otherwise a meadow side. Meadows
 * list the towns of the same tile they border (for end scoring). Each feature has an anchor (in
 * 0–100 tile units) where a warden stands, and the town and road shapes are drawn from simple
 * geometry by the board.
 *
 * The set is our own: 22 tile types (two of them — a shrine on a straight road and a town gate
 * with a crossroads — beyond the genre's usual base set) in our own numbers, 69 tiles in all.
 */

export type FeatureKind = 'town' | 'road' | 'meadow' | 'shrine';
export interface FeatureDef {
  kind: FeatureKind;
  ports: number[];
  /** Towns of this tile a meadow borders (indices into features). */
  touches?: number[];
  /** A banner doubles a town tile's worth. */
  banner?: boolean;
  /** Where a warden stands (tile units, 0–100). */
  at: [number, number];
}
export interface TileType {
  id: string;
  count: number;
  features: FeatureDef[];
}

const ALL = Array.from({ length: 12 }, (_, i) => i);
const not = (xs: number[]) => ALL.filter((p) => !xs.includes(p));

const T = (id: string, count: number, features: FeatureDef[]): TileType => ({
  id,
  count,
  features,
});

export const TILE_TYPES: TileType[] = [
  T('shrine', 3, [
    { kind: 'shrine', ports: [], at: [50, 50] },
    { kind: 'meadow', ports: ALL, at: [20, 80] },
  ]),
  T('shrine-road', 2, [
    { kind: 'shrine', ports: [], at: [50, 42] },
    { kind: 'road', ports: [7], at: [50, 82] },
    { kind: 'meadow', ports: not([7]), at: [18, 20] },
  ]),
  T('shrine-through', 2, [
    { kind: 'shrine', ports: [], at: [50, 26] },
    { kind: 'road', ports: [4, 10], at: [74, 50] },
    { kind: 'meadow', ports: [11, 0, 1, 2, 3], at: [16, 18] },
    { kind: 'meadow', ports: [5, 6, 7, 8, 9], at: [50, 80] },
  ]),
  T('town-full', 1, [{ kind: 'town', ports: ALL, banner: true, at: [50, 50] }]),
  T('town-three', 3, [
    { kind: 'town', ports: [0, 1, 2, 3, 4, 5, 9, 10, 11], at: [50, 38] },
    { kind: 'meadow', ports: [6, 7, 8], touches: [0], at: [50, 88] },
  ]),
  T('town-three-banner', 1, [
    { kind: 'town', ports: [0, 1, 2, 3, 4, 5, 9, 10, 11], banner: true, at: [50, 38] },
    { kind: 'meadow', ports: [6, 7, 8], touches: [0], at: [50, 88] },
  ]),
  T('town-three-road', 2, [
    { kind: 'town', ports: [0, 1, 2, 3, 4, 5, 9, 10, 11], banner: true, at: [50, 36] },
    { kind: 'road', ports: [7], at: [50, 84] },
    { kind: 'meadow', ports: [6], touches: [0], at: [80, 90] },
    { kind: 'meadow', ports: [8], touches: [0], at: [20, 90] },
  ]),
  T('town-corner', 3, [
    { kind: 'town', ports: [0, 1, 2, 3, 4, 5], at: [70, 30] },
    { kind: 'meadow', ports: [6, 7, 8, 9, 10, 11], touches: [0], at: [28, 72] },
  ]),
  T('town-corner-banner', 2, [
    { kind: 'town', ports: [0, 1, 2, 3, 4, 5], banner: true, at: [70, 30] },
    { kind: 'meadow', ports: [6, 7, 8, 9, 10, 11], touches: [0], at: [28, 72] },
  ]),
  T('town-corner-road', 4, [
    { kind: 'town', ports: [0, 1, 2, 3, 4, 5], at: [72, 28] },
    { kind: 'road', ports: [7, 10], at: [40, 60] },
    { kind: 'meadow', ports: [6, 11], touches: [0], at: [62, 62] },
    { kind: 'meadow', ports: [8, 9], at: [14, 86] },
  ]),
  T('town-tube', 2, [
    { kind: 'town', ports: [0, 1, 2, 6, 7, 8], banner: true, at: [50, 50] },
    { kind: 'meadow', ports: [3, 4, 5], touches: [0], at: [88, 50] },
    { kind: 'meadow', ports: [9, 10, 11], touches: [0], at: [12, 50] },
  ]),
  T('town-caps-opposite', 3, [
    { kind: 'town', ports: [0, 1, 2], at: [50, 12] },
    { kind: 'town', ports: [6, 7, 8], at: [50, 88] },
    { kind: 'meadow', ports: [3, 4, 5, 9, 10, 11], touches: [0, 1], at: [50, 50] },
  ]),
  T('town-caps-corner', 2, [
    { kind: 'town', ports: [0, 1, 2], at: [42, 12] },
    { kind: 'town', ports: [3, 4, 5], at: [88, 58] },
    { kind: 'meadow', ports: [6, 7, 8, 9, 10, 11], touches: [0, 1], at: [36, 64] },
  ]),
  T('town-cap', 5, [
    { kind: 'town', ports: [0, 1, 2], at: [50, 14] },
    { kind: 'meadow', ports: not([0, 1, 2]), touches: [0], at: [50, 64] },
  ]),
  T('town-cap-straight', 4, [
    { kind: 'town', ports: [0, 1, 2], at: [50, 12] },
    { kind: 'road', ports: [4, 10], at: [30, 50] },
    { kind: 'meadow', ports: [3, 11], touches: [0], at: [74, 32] },
    { kind: 'meadow', ports: [5, 6, 7, 8, 9], at: [50, 82] },
  ]),
  T('town-cap-curve-left', 3, [
    { kind: 'town', ports: [0, 1, 2], at: [50, 12] },
    { kind: 'road', ports: [7, 10], at: [36, 64] },
    { kind: 'meadow', ports: [3, 4, 5, 6, 11], touches: [0], at: [72, 56] },
    { kind: 'meadow', ports: [8, 9], at: [14, 86] },
  ]),
  T('town-cap-curve-right', 3, [
    { kind: 'town', ports: [0, 1, 2], at: [50, 12] },
    { kind: 'road', ports: [4, 7], at: [64, 64] },
    { kind: 'meadow', ports: [3, 8, 9, 10, 11], touches: [0], at: [28, 56] },
    { kind: 'meadow', ports: [5, 6], at: [86, 86] },
  ]),
  T('town-gate-cross', 2, [
    { kind: 'town', ports: [0, 1, 2], at: [50, 12] },
    { kind: 'road', ports: [4], at: [82, 50] },
    { kind: 'road', ports: [7], at: [50, 84] },
    { kind: 'road', ports: [10], at: [18, 50] },
    { kind: 'meadow', ports: [3, 11], touches: [0], at: [50, 36] },
    { kind: 'meadow', ports: [5, 6], at: [84, 84] },
    { kind: 'meadow', ports: [8, 9], at: [16, 84] },
  ]),
  T('road-straight', 8, [
    { kind: 'road', ports: [1, 7], at: [50, 40] },
    { kind: 'meadow', ports: [2, 3, 4, 5, 6], at: [80, 50] },
    { kind: 'meadow', ports: [8, 9, 10, 11, 0], at: [20, 50] },
  ]),
  T('road-curve', 9, [
    { kind: 'road', ports: [7, 10], at: [36, 64] },
    { kind: 'meadow', ports: [8, 9], at: [14, 86] },
    { kind: 'meadow', ports: [11, 0, 1, 2, 3, 4, 5, 6], at: [70, 30] },
  ]),
  T('road-junction', 4, [
    { kind: 'road', ports: [4], at: [82, 50] },
    { kind: 'road', ports: [7], at: [50, 84] },
    { kind: 'road', ports: [10], at: [18, 50] },
    { kind: 'meadow', ports: [11, 0, 1, 2, 3], at: [50, 22] },
    { kind: 'meadow', ports: [5, 6], at: [84, 84] },
    { kind: 'meadow', ports: [8, 9], at: [16, 84] },
  ]),
  T('road-cross', 1, [
    { kind: 'road', ports: [1], at: [50, 16] },
    { kind: 'road', ports: [4], at: [84, 50] },
    { kind: 'road', ports: [7], at: [50, 84] },
    { kind: 'road', ports: [10], at: [16, 50] },
    { kind: 'meadow', ports: [2, 3], at: [84, 16] },
    { kind: 'meadow', ports: [5, 6], at: [84, 84] },
    { kind: 'meadow', ports: [8, 9], at: [16, 84] },
    { kind: 'meadow', ports: [11, 0], at: [16, 16] },
  ]),
];

/** The starting tile (placed at 0,0 before play): a town cap with a straight road. */
export const START_TYPE = TILE_TYPES.findIndex((t) => t.id === 'town-cap-straight');
export const TOTAL_TILES = TILE_TYPES.reduce((a, t) => a + t.count, 0);

export type Side = 'town' | 'road' | 'meadow';

/** Port p after rotating a tile r quarter turns clockwise. */
export const rotPort = (p: number, r: number) => (p + 3 * r) % 12;

/** The feature index owning each port of a tile type (unrotated). */
export const PORT_FEATURE: number[][] = TILE_TYPES.map((t) => {
  const out = Array<number>(12).fill(-1);
  t.features.forEach((f, i) => f.ports.forEach((p) => (out[p] = i)));
  return out;
});

/** Side kinds (N, E, S, W) of a tile type rotated r quarter turns. */
export function sides(type: number, r: number): Side[] {
  const t = TILE_TYPES[type]!;
  const pf = PORT_FEATURE[type]!;
  return [0, 1, 2, 3].map((s) => {
    // Port q of the rotated tile came from port q − 3r of the unrotated one.
    const from = (q: number) => (q - 3 * r + 120) % 12;
    const mid = t.features[pf[from(3 * s + 1)]!]!;
    if (mid.kind === 'town') return 'town';
    if (mid.kind === 'road') return 'road';
    return 'meadow';
  });
}
