/**
 * Global Front world: the invented continent-pair of Meridian on a hex grid (like #248), with 26
 * land territories and 7 sea zones; four invented powers in two alliances, territory values,
 * victory cities, factories, eight unit types and the opening set-up. Computed once,
 * deterministically.
 */

export type Kind = 'land' | 'sea';
export const POWERS = [
  { id: 'varn', name: { en: 'Varn Dominion', es: 'Dominio de Varn' }, side: 0 },
  { id: 'kelt', name: { en: 'Kelt Union', es: 'Unión Kelt' }, side: 1 },
  { id: 'ossia', name: { en: 'Ossian League', es: 'Liga Osiana' }, side: 0 },
  { id: 'tamar', name: { en: 'Tamaran Republic', es: 'República Tamarana' }, side: 1 },
] as const;
export const SIDES = [
  { en: 'Northern Pact', es: 'Pacto del Norte' },
  { en: 'Southern Accord', es: 'Concordia del Sur' },
] as const;
/** Power of each side, in turn order: Varn, Kelt, Ossia, Tamar. */
export const sideOf = (power: number) => POWERS[power]!.side;

export type UnitKind =
  | 'infantry'
  | 'artillery'
  | 'armor'
  | 'fighter'
  | 'bomber'
  | 'transport'
  | 'cruiser'
  | 'battleship';
export interface UnitType {
  kind: UnitKind;
  cost: number;
  attack: number;
  defense: number;
  move: number;
  domain: 'land' | 'air' | 'sea';
  /** Hits it takes to sink or destroy it. */
  hp: number;
}
export const UNITS: UnitType[] = [
  { kind: 'infantry', cost: 3, attack: 1, defense: 2, move: 1, domain: 'land', hp: 1 },
  { kind: 'artillery', cost: 4, attack: 2, defense: 2, move: 1, domain: 'land', hp: 1 },
  { kind: 'armor', cost: 6, attack: 3, defense: 3, move: 2, domain: 'land', hp: 1 },
  { kind: 'fighter', cost: 10, attack: 3, defense: 4, move: 4, domain: 'air', hp: 1 },
  { kind: 'bomber', cost: 12, attack: 4, defense: 1, move: 6, domain: 'air', hp: 1 },
  { kind: 'transport', cost: 7, attack: 0, defense: 0, move: 2, domain: 'sea', hp: 1 },
  { kind: 'cruiser', cost: 10, attack: 3, defense: 3, move: 2, domain: 'sea', hp: 1 },
  { kind: 'battleship', cost: 20, attack: 4, defense: 4, move: 2, domain: 'sea', hp: 2 },
];
export const KINDS = UNITS.map((u) => u.kind);
export const unitType = (k: UnitKind) => UNITS.find((u) => u.kind === k)!;
export const TRANSPORT_CAPACITY = 2;

interface LocDef {
  name: { en: string; es: string };
  kind: Kind;
  at: [number, number];
  owner?: number;
  value?: number;
  city?: boolean;
  factory?: boolean;
  capital?: boolean;
}
const L = (
  en: string,
  es: string,
  c: number,
  r: number,
  owner: number,
  value: number,
  extra: Partial<LocDef> = {},
): LocDef => ({ name: { en, es }, kind: 'land', at: [c, r], owner, value, ...extra });
const S = (en: string, es: string, c: number, r: number): LocDef => ({
  name: { en, es },
  kind: 'sea',
  at: [c, r],
});

const DEFS: LocDef[] = [
  // Varn (north-west)
  L('Varnhold', 'Varnhold', 2, 1, 0, 6, { city: true, factory: true, capital: true }),
  L('Greymark', 'Marcagris', 5.5, 1.2, 0, 3, { city: true }),
  L('Coldwater', 'Aguafría', 8.5, 1, 0, 2),
  L('Hollin', 'Hollin', 2.5, 4, 0, 2),
  L('Brennmoor', 'Brennmoor', 6, 4, 0, 2, { factory: true }),
  L('Tarsk', 'Tarsk', 9.5, 3.8, 0, 1, { city: true }),
  // Kelt (north-east)
  L('Kelt Harbour', 'Puerto Kelt', 19.5, 1.3, 1, 6, { city: true, factory: true, capital: true }),
  L('Aldermere', 'Aldermere', 16.2, 1, 1, 3, { city: true }),
  L('Fenwick', 'Fenwick', 12.8, 1.3, 1, 2),
  L('Dunrow', 'Dunrow', 12.6, 4, 1, 1),
  L('Ravensholt', 'Ravensholt', 15.8, 4, 1, 2, { factory: true }),
  L('Saltcliff', 'Acantisal', 19, 4.4, 1, 2, { city: true }),
  // Ossia (south-east)
  L('Ossiara', 'Osiara', 19.5, 12.4, 2, 6, { city: true, factory: true, capital: true }),
  L('Jadeport', 'Puerto Jade', 16.2, 12.6, 2, 3, { city: true }),
  L('Marrow Flats', 'Llanos de Marrow', 12.8, 12.3, 2, 2),
  L('Thornvale', 'Valle Espino', 12.6, 9.6, 2, 2),
  L('Kessa', 'Kessa', 15.8, 9.4, 2, 2, { factory: true }),
  L('Ember Point', 'Punta Ascua', 19, 9.2, 2, 1, { city: true }),
  // Tamar (south-west)
  L('Tamaran', 'Tamarán', 2, 12.4, 3, 6, { city: true, factory: true, capital: true }),
  L('Sunreach', 'Alcance del Sol', 5.5, 12.6, 3, 3, { city: true }),
  L('Oasis Gate', 'Puerta del Oasis', 8.8, 12.3, 3, 2),
  L('Redcliff', 'Acantirrojo', 2.5, 9.4, 3, 2),
  L('Lowmere', 'Lowmere', 6, 9.4, 3, 2, { factory: true }),
  L('Cape Verdan', 'Cabo Verdán', 9.6, 9.6, 3, 1, { city: true }),
  // Isthmuses: land bridges between the continents.
  L('Wren Isthmus', 'Istmo de Wren', 5.6, 6.8, 3, 1),
  L('Corran Isthmus', 'Istmo de Corran', 15.6, 6.8, 2, 1),
  // Seas
  S('Westwater', 'Aguas del Oeste', 0.6, 6.8),
  S('Wren Sound', 'Estrecho de Wren', 3.2, 6.6),
  S('Middle Sea West', 'Mar Medio Oeste', 8.4, 6.8),
  S('Middle Sea', 'Mar Medio', 11, 6.8),
  S('Middle Sea East', 'Mar Medio Este', 13.4, 6.6),
  S('Corran Sound', 'Estrecho de Corran', 18.2, 6.8),
  S('Eastwater', 'Aguas del Este', 21, 6.8),
];

export const COLS = 22;
export const ROWS = 14;
const SQ3 = Math.sqrt(3);
export const cellXY = (c: number, r: number): [number, number] => [
  SQ3 * (c + (r & 1 ? 0.5 : 0)),
  1.5 * r,
];
function neighbours(c: number, r: number): [number, number][] {
  const d =
    r & 1
      ? [
          [1, 0],
          [-1, 0],
          [0, -1],
          [1, -1],
          [0, 1],
          [1, 1],
        ]
      : [
          [1, 0],
          [-1, 0],
          [-1, -1],
          [0, -1],
          [-1, 1],
          [0, 1],
        ];
  return d.map(([dc, dr]) => [c + dc!, r + dr!] as [number, number]);
}

export interface Loc {
  name: { en: string; es: string };
  kind: Kind;
  owner: number;
  value: number;
  city: boolean;
  factory: boolean;
  capital: boolean;
  cells: [number, number][];
  label: [number, number];
  adj: number[];
}

function build() {
  const seeds = DEFS.map((d) => [SQ3 * (d.at[0] + 0.25), 1.5 * d.at[1]] as [number, number]);
  const grid: number[][] = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  const locs: Loc[] = DEFS.map((d) => ({
    name: d.name,
    kind: d.kind,
    owner: d.owner ?? -1,
    value: d.value ?? 0,
    city: !!d.city,
    factory: !!d.factory,
    capital: !!d.capital,
    cells: [],
    label: [0, 0],
    adj: [],
  }));
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const [x, y] = cellXY(c, r);
      let best = 0;
      let bd = Infinity;
      seeds.forEach(([sx, sy], i) => {
        // Sea zones reach a little further, so the middle band is open water.
        const w = DEFS[i]!.kind === 'sea' ? 0.72 : 1;
        const d = ((x - sx) ** 2 + (y - sy) ** 2) * w;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      grid[r]![c] = best;
      locs[best]!.cells.push([c, r]);
    }
  const adj = locs.map(() => new Set<number>());
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const a = grid[r]![c]!;
      for (const [nc, nr] of neighbours(c, r)) {
        const b = grid[nr]?.[nc];
        if (b !== undefined && b !== a) {
          adj[a]!.add(b);
          adj[b]!.add(a);
        }
      }
    }
  locs.forEach((l, i) => {
    l.adj = [...adj[i]!].sort((a, b) => a - b);
    const pts = l.cells.map(([c, r]) => cellXY(c, r));
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let bi = 0;
    let bd = Infinity;
    pts.forEach((p, k) => {
      const d = (p[0] - mx) ** 2 + (p[1] - my) ** 2;
      if (d < bd) {
        bd = d;
        bi = k;
      }
    });
    l.label = l.cells[bi]!;
  });
  return { locs, grid };
}
const BUILT = build();
export const LOCS = BUILT.locs;
export const GRID = BUILT.grid;
export const isSea = (i: number) => LOCS[i]!.kind === 'sea';
export const CITIES = LOCS.map((l, i) => (l.city ? i : -1)).filter((i) => i >= 0);
export const CAPITALS = POWERS.map((_, p) => LOCS.findIndex((l) => l.capital && l.owner === p));
/** Victory cities an alliance needs at the end of a round. */
export const WIN_CITIES = 9;
export const MAX_ROUNDS = 15;

const seaNamed = (en: string) => LOCS.findIndex((l) => l.name.en === en);
/** Home waters of each power's fleet (off one of its factories). */
export const FLEETS = [
  seaNamed('Middle Sea West'),
  seaNamed('Middle Sea East'),
  seaNamed('Corran Sound'),
  seaNamed('Westwater'),
];

/** Opening forces: by territory value, plus each power's fleet in its home waters. */
export function openingUnits(): { kind: UnitKind; owner: number; loc: number }[] {
  const out: { kind: UnitKind; owner: number; loc: number }[] = [];
  const add = (kind: UnitKind, owner: number, loc: number, n = 1) => {
    for (let k = 0; k < n; k++) out.push({ kind, owner, loc });
  };
  LOCS.forEach((l, i) => {
    if (l.kind !== 'land') return;
    const p = l.owner;
    if (l.capital) {
      add('infantry', p, i, 4);
      add('artillery', p, i, 2);
      add('armor', p, i, 2);
      add('fighter', p, i, 2);
      add('bomber', p, i, 1);
    } else if (l.value >= 3) {
      add('infantry', p, i, 3);
      add('artillery', p, i);
      add('armor', p, i);
    } else if (l.value === 2) add('infantry', p, i, 2);
    else add('infantry', p, i, 1);
    if (l.factory && !l.capital) {
      add('armor', p, i);
      add('fighter', p, i);
    }
  });
  // Each power's fleet in its home waters.
  POWERS.forEach((_, p) => {
    const sea = FLEETS[p]!;
    add('transport', p, sea, 2);
    add('cruiser', p, sea);
    add('battleship', p, sea);
  });
  return out;
}
