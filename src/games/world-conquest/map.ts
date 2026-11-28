/**
 * The World Conquest map: an invented world of six landmasses and 36 territories, built on a hex
 * grid so that borders, adjacency and drawing all come from one source. Each landmass is a union
 * of ellipses; every land cell belongs to its landmass's nearest territory seed. Neighbouring cells
 * of different territories make them adjacent; listed sea lanes join territories across water.
 * Everything is computed once, deterministically, at load.
 */

export interface RegionDef {
  id: string;
  name: { en: string; es: string };
  bonus: number;
  /** Ellipses in grid units: [col, row, radius in cols, radius in rows]. */
  blobs: [number, number, number, number][];
  territories: { id: string; name: { en: string; es: string }; at: [number, number] }[];
}

const T = (id: string, en: string, es: string, c: number, r: number) => ({
  id,
  name: { en, es },
  at: [c, r] as [number, number],
});

export const REGIONS: RegionDef[] = [
  {
    id: 'frostmark',
    name: { en: 'Frostmark', es: 'Marca Helada' },
    bonus: 3,
    blobs: [
      [5, 3.4, 5.2, 3],
      [2.5, 6, 2, 1.4],
    ],
    territories: [
      T('glacier-gate', 'Glacier Gate', 'Puerta del Glaciar', 2, 2),
      T('rime-fjords', 'Rime Fjords', 'Fiordos de Escarcha', 5, 1),
      T('whitepeak', 'Whitepeak', 'Picoblanco', 8.5, 2),
      T('snowmere', 'Snowmere', 'Lago Nevado', 2.5, 5.5),
      T('wolfhold', 'Wolfhold', 'Bastión del Lobo', 5.5, 4),
      T('hoarfrost-bay', 'Hoarfrost Bay', 'Bahía de la Helada', 8.5, 5),
    ],
  },
  {
    id: 'iron-steppes',
    name: { en: 'Iron Steppes', es: 'Estepas de Hierro' },
    bonus: 5,
    blobs: [
      [19, 3.2, 7.4, 2.9],
      [13.6, 4.6, 1.8, 1.4],
    ],
    territories: [
      T('cinder-road', 'Cinder Road', 'Camino de Ceniza', 13.5, 4),
      T('khar-plateau', 'Khar Plateau', 'Meseta de Khar', 15.5, 1.5),
      T('horse-sea', 'Horse Sea', 'Mar de Caballos', 18.5, 1),
      T('tamar-wells', 'Tamar Wells', 'Pozos de Tamar', 22, 1.5),
      T('boreal-gate', 'Boreal Gate', 'Puerta Boreal', 25, 3),
      T('ironforge', 'Ironforge', 'Forjahierro', 17.5, 4.5),
      T('dustwind', 'Dustwind', 'Vientopolvo', 21.5, 5),
    ],
  },
  {
    id: 'verdant-coast',
    name: { en: 'Verdant Coast', es: 'Costa Verde' },
    bonus: 3,
    blobs: [
      [4.4, 11.2, 3.6, 3.4],
      [3, 14.8, 2, 1],
    ],
    territories: [
      T('mossbridge', 'Mossbridge', 'Puentemusgo', 3, 9),
      T('fernhaven', 'Fernhaven', 'Refugio del Helecho', 6, 10),
      T('lowmarsh', 'Lowmarsh', 'Marisma Baja', 2.5, 12),
      T('orchard-vale', 'Orchard Vale', 'Valle de Huertos', 5.8, 12.6),
      T('willow-cape', 'Willow Cape', 'Cabo del Sauce', 3, 14.8),
    ],
  },
  {
    id: 'sunken-kingdoms',
    name: { en: 'Sunken Kingdoms', es: 'Reinos Hundidos' },
    bonus: 4,
    blobs: [[13.2, 9.6, 4.2, 2.8]],
    territories: [
      T('drowned-crown', 'Drowned Crown', 'Corona Ahogada', 11, 8),
      T('bell-tower', 'Bell Tower', 'Torre de la Campana', 14, 7.5),
      T('tidegate', 'Tidegate', 'Compuerta de Marea', 16.4, 9.4),
      T('saltmarch', 'Saltmarch', 'Marcha Salada', 12.6, 10),
      T('lantern-port', 'Lantern Port', 'Puerto Farol', 15, 11.6),
      T('reedholm', 'Reedholm', 'Islote de Juncos', 10.6, 11.4),
    ],
  },
  {
    id: 'ashen-waste',
    name: { en: 'Ashen Waste', es: 'Páramo Ceniciento' },
    bonus: 3,
    blobs: [[22.8, 10.6, 4.4, 3.4]],
    territories: [
      T('emberfall', 'Emberfall', 'Caída de Brasas', 20.4, 8.4),
      T('obsidian-ridge', 'Obsidian Ridge', 'Cresta de Obsidiana', 23.4, 7.8),
      T('sulfur-flats', 'Sulfur Flats', 'Llanos de Azufre', 25.8, 9.6),
      T('glass-dunes', 'Glass Dunes', 'Dunas de Vidrio', 21, 11.2),
      T('pyre-hollow', 'Pyre Hollow', 'Hondonada de la Pira', 24.4, 12),
      T('last-oasis', 'Last Oasis', 'Último Oasis', 22, 13.6),
    ],
  },
  {
    id: 'coral-isles',
    name: { en: 'Coral Isles', es: 'Islas de Coral' },
    bonus: 3,
    blobs: [
      [10.6, 15.2, 1.9, 1.3],
      [14.4, 15.5, 2.9, 1.9],
      [18, 15.2, 1.8, 1.3],
    ],
    territories: [
      T('pearl-key', 'Pearl Key', 'Cayo Perla', 10.4, 15.2),
      T('turtle-reach', 'Turtle Reach', 'Paso de Tortugas', 13.2, 14.6),
      T('lagoon-court', 'Lagoon Court', 'Corte de la Laguna', 15.2, 14.8),
      T('shell-strand', 'Shell Strand', 'Playa de Conchas', 13.6, 16.4),
      T('sunfish-atoll', 'Sunfish Atoll', 'Atolón del Pez Sol', 15.6, 16.4),
      T('gull-rock', 'Gull Rock', 'Roca de Gaviotas', 18, 15.2),
    ],
  },
];

/** Sea lanes between territories of different (or the same, for islands) landmasses. */
const LANES: [string, string][] = [
  ['hoarfrost-bay', 'cinder-road'],
  ['whitepeak', 'khar-plateau'],
  ['snowmere', 'mossbridge'],
  ['hoarfrost-bay', 'drowned-crown'],
  ['fernhaven', 'drowned-crown'],
  ['orchard-vale', 'reedholm'],
  ['willow-cape', 'pearl-key'],
  ['cinder-road', 'bell-tower'],
  ['ironforge', 'tidegate'],
  ['dustwind', 'emberfall'],
  ['tidegate', 'emberfall'],
  ['lantern-port', 'glass-dunes'],
  ['reedholm', 'pearl-key'],
  ['lantern-port', 'lagoon-court'],
  ['pearl-key', 'turtle-reach'],
  ['lagoon-court', 'gull-rock'],
  ['last-oasis', 'gull-rock'],
  ['boreal-gate', 'sulfur-flats'],
];

export const COLS = 28;
export const ROWS = 18;
const SQ3 = Math.sqrt(3);
/** Centre of grid cell (col, row) in drawing units (odd rows shifted right). */
export const cellXY = (c: number, r: number): [number, number] => [
  SQ3 * (c + (r & 1 ? 0.5 : 0)),
  1.5 * r,
];
/** Grid coordinates of a fractional (col, row) point, for seeds and blobs. */
const pointXY = (c: number, r: number): [number, number] => [SQ3 * (c + 0.25), 1.5 * r];

function neighbours(c: number, r: number): [number, number][] {
  const odd = r & 1;
  const d = odd
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

export interface Territory {
  id: string;
  name: { en: string; es: string };
  region: number;
  cells: [number, number][];
  /** Label position (the cell nearest the territory's mean). */
  label: [number, number];
  adj: number[];
}
export interface WorldMap {
  territories: Territory[];
  regions: { id: string; name: { en: string; es: string }; bonus: number; members: number[] }[];
  /** Owner territory of each cell (−1 for sea), by row then column. */
  grid: number[][];
  lanes: [number, number][];
}

function build(): WorldMap {
  const terrs: Territory[] = [];
  REGIONS.forEach((reg, ri) =>
    reg.territories.forEach((t) =>
      terrs.push({ id: t.id, name: t.name, region: ri, cells: [], label: [0, 0], adj: [] }),
    ),
  );
  const seeds = REGIONS.flatMap((reg) => reg.territories.map((t) => pointXY(t.at[0], t.at[1])));
  const grid: number[][] = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const [x, y] = cellXY(c, r);
      const ri = REGIONS.findIndex((reg) =>
        reg.blobs.some(([bc, br, rc, rr]) => {
          const [bx, by] = pointXY(bc, br);
          return ((x - bx) / (rc * SQ3)) ** 2 + ((y - by) / (rr * 1.5)) ** 2 <= 1;
        }),
      );
      if (ri < 0) continue;
      let best = -1;
      let bd = Infinity;
      terrs.forEach((t, ti) => {
        if (t.region !== ri) return;
        const [sx, sy] = seeds[ti]!;
        const d = (x - sx) ** 2 + (y - sy) ** 2;
        if (d < bd) {
          bd = d;
          best = ti;
        }
      });
      grid[r]![c] = best;
      terrs[best]!.cells.push([c, r]);
    }
  // Adjacency through shared cell borders.
  const adj = terrs.map(() => new Set<number>());
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const a = grid[r]![c]!;
      if (a < 0) continue;
      for (const [nc, nr] of neighbours(c, r)) {
        const b = grid[nr]?.[nc];
        if (b !== undefined && b >= 0 && b !== a) {
          adj[a]!.add(b);
          adj[b]!.add(a);
        }
      }
    }
  const index = new Map(terrs.map((t, i) => [t.id, i]));
  const lanes = LANES.map(([a, b]) => {
    const i = index.get(a);
    const j = index.get(b);
    if (i === undefined || j === undefined) throw new Error(`Unknown lane ${a}–${b}`);
    adj[i]!.add(j);
    adj[j]!.add(i);
    return [i, j] as [number, number];
  });
  terrs.forEach((t, i) => {
    t.adj = [...adj[i]!].sort((a, b) => a - b);
    const pts = t.cells.map(([c, r]) => cellXY(c, r));
    const mx = pts.reduce((s, p) => s + p[0], 0) / Math.max(1, pts.length);
    const my = pts.reduce((s, p) => s + p[1], 0) / Math.max(1, pts.length);
    let best = t.cells[0] ?? [0, 0];
    let bd = Infinity;
    t.cells.forEach((cell, k) => {
      const d = (pts[k]![0] - mx) ** 2 + (pts[k]![1] - my) ** 2;
      if (d < bd) {
        bd = d;
        best = cell;
      }
    });
    t.label = best;
  });
  return {
    territories: terrs,
    regions: REGIONS.map((reg, ri) => ({
      id: reg.id,
      name: reg.name,
      bonus: reg.bonus,
      members: terrs.map((t, i) => (t.region === ri ? i : -1)).filter((i) => i >= 0),
    })),
    grid,
    lanes,
  };
}

export const MAP = build();
