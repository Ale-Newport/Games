/**
 * Fading Empires world: an invented valley of 26 regions built on a hex grid (like #248's map):
 * each region is the set of land cells nearest its seed inside the valley's outline; cells of
 * different regions that touch make them neighbours. Regions have a terrain (farmland, forest,
 * hills, marsh, mountain, lake), maybe a feature (a spring, a mine or a cave), and some start with
 * a wild tribe. Regions on the outline are borders, where a new people may land. Lakes cannot be
 * taken. Everything is computed once, deterministically.
 *
 * Also here: the ten peoples and twelve traits, all our own.
 */

export type Terrain = 'farmland' | 'forest' | 'hills' | 'marsh' | 'mountain' | 'lake';
export type Feature = 'spring' | 'mine' | 'cave' | null;

interface RegionDef {
  name: { en: string; es: string };
  terrain: Terrain;
  feature: Feature;
  tribe: boolean;
  at: [number, number];
}
const R = (
  en: string,
  es: string,
  terrain: Terrain,
  c: number,
  r: number,
  feature: Feature = null,
  tribe = false,
): RegionDef => ({
  name: { en, es },
  terrain,
  feature,
  tribe,
  at: [c, r],
});

const DEFS: RegionDef[] = [
  R('Northmoor', 'Páramo Norte', 'marsh', 1.5, 1, null, true),
  R('Flint Ridge', 'Cresta de Pedernal', 'mountain', 4.5, 0.8, 'mine'),
  R('Barley Reach', 'Campos de Cebada', 'farmland', 7.5, 1.2),
  R('Old Wood', 'Bosque Viejo', 'forest', 10.5, 0.8, 'spring', true),
  R('Bramble Down', 'Loma de Zarzas', 'hills', 13.5, 1.2),
  R('Grey Fen', 'Ciénaga Gris', 'marsh', 16.5, 1, 'cave'),
  R('Westmere', 'Lago del Oeste', 'lake', 1.2, 4.2),
  R('Copper Hills', 'Colinas de Cobre', 'hills', 4, 3.8, 'mine', true),
  R('Millbrook', 'Arroyo del Molino', 'farmland', 7, 4),
  R('Crow Peak', 'Pico del Cuervo', 'mountain', 10, 3.6, 'cave'),
  R('Hollow Glen', 'Cañada Hueca', 'forest', 13, 4, null, true),
  R('Saltmarsh Edge', 'Orilla Salobre', 'marsh', 16.6, 4.2),
  R('Stonewater', 'Aguapiedra', 'hills', 2, 7, 'spring'),
  R('Green Lea', 'Prado Verde', 'farmland', 5, 6.8, null, true),
  R('Deepmere', 'Lago Hondo', 'lake', 8.4, 6.6),
  R('Thorn Wood', 'Bosque de Espinos', 'forest', 11.6, 7, 'mine'),
  R('High Pasture', 'Pasto Alto', 'farmland', 14.6, 6.8),
  R('Eagle Crag', 'Risco del Águila', 'mountain', 17.2, 7.4, 'mine'),
  R('Reedford', 'Vado de Juncos', 'marsh', 1.6, 9.8, 'cave', true),
  R('Sunfield', 'Campo del Sol', 'farmland', 4.6, 10),
  R('Ember Vale', 'Valle Ascua', 'hills', 7.8, 9.6, 'cave'),
  R('Pine Hollow', 'Hondonada de Pinos', 'forest', 10.8, 10, null, true),
  R('Bell Hill', 'Colina de la Campana', 'hills', 13.8, 9.8, 'spring'),
  R('Southmarch', 'Marca del Sur', 'farmland', 16.6, 10.2),
  R('Granite Gate', 'Puerta de Granito', 'mountain', 6.2, 12, null, true),
  R('Willow Shore', 'Ribera de Sauces', 'forest', 12.4, 12, 'spring'),
];

export const COLS = 19;
export const ROWS = 13;
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

export interface Region {
  name: { en: string; es: string };
  terrain: Terrain;
  feature: Feature;
  tribe: boolean;
  cells: [number, number][];
  label: [number, number];
  adj: number[];
  /** On the valley's outline (cells at the grid edge). */
  border: boolean;
  /** Touches a lake. */
  shore: boolean;
}

function build() {
  const seeds = DEFS.map((d) => [SQ3 * (d.at[0] + 0.25), 1.5 * d.at[1]] as [number, number]);
  const grid: number[][] = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  const regions: Region[] = DEFS.map((d) => ({
    name: d.name,
    terrain: d.terrain,
    feature: d.feature,
    tribe: d.tribe,
    cells: [],
    label: [0, 0],
    adj: [],
    border: false,
    shore: false,
  }));
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const [x, y] = cellXY(c, r);
      let best = 0;
      let bd = Infinity;
      seeds.forEach(([sx, sy], i) => {
        const dd = (x - sx) ** 2 + (y - sy) ** 2;
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      grid[r]![c] = best;
      regions[best]!.cells.push([c, r]);
      if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) regions[best]!.border = true;
    }
  const adj = regions.map(() => new Set<number>());
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
  regions.forEach((reg, i) => {
    reg.adj = [...adj[i]!].sort((a, b) => a - b);
    reg.shore = reg.adj.some((j) => regions[j]!.terrain === 'lake');
    const pts = reg.cells.map(([c, r]) => cellXY(c, r));
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
    reg.label = reg.cells[bi]!;
  });
  return { regions, grid };
}

const BUILT = build();
export const REGIONS = BUILT.regions;
export const GRID = BUILT.grid;

/* ---------- peoples and traits ---------- */

export interface People {
  id: string;
  name: { en: string; es: string };
  bands: number;
  text: { en: string; es: string };
}
export interface Trait {
  id: string;
  name: { en: string; es: string };
  bands: number;
  text: { en: string; es: string };
}

export const PEOPLES: People[] = [
  {
    id: 'stonefolk',
    name: { en: 'Stonefolk', es: 'Gente de piedra' },
    bands: 5,
    text: { en: '+1 coin for each hills region.', es: '+1 moneda por cada región de colinas.' },
  },
  {
    id: 'marshlings',
    name: { en: 'Marshlings', es: 'Ciénagos' },
    bands: 6,
    text: {
      en: 'Marsh regions cost 1 band less to take.',
      es: 'Las ciénagas cuestan 1 banda menos.',
    },
  },
  {
    id: 'riverkin',
    name: { en: 'Riverkin', es: 'Gente del río' },
    bands: 5,
    text: {
      en: '+1 coin for each region on a lake shore.',
      es: '+1 moneda por cada región a orillas de un lago.',
    },
  },
  {
    id: 'ashborn',
    name: { en: 'Ashborn', es: 'Nacidos de ceniza' },
    bands: 6,
    text: {
      en: 'Mine regions cost 1 less and pay +1 coin.',
      es: 'Las regiones con mina cuestan 1 menos y dan +1 moneda.',
    },
  },
  {
    id: 'wildlings',
    name: { en: 'Wildlings', es: 'Salvajes' },
    bands: 6,
    text: {
      en: 'Forest regions cost 1 band less to take.',
      es: 'Los bosques cuestan 1 banda menos.',
    },
  },
  {
    id: 'hordes',
    name: { en: 'Hordes', es: 'Hordas' },
    bands: 9,
    text: { en: 'No gift but their numbers.', es: 'Su único don es su número.' },
  },
  {
    id: 'skyriders',
    name: { en: 'Sky Riders', es: 'Jinetes del cielo' },
    bands: 5,
    text: {
      en: 'May take any land region, near or far.',
      es: 'Pueden tomar cualquier región de tierra, cerca o lejos.',
    },
  },
  {
    id: 'delvers',
    name: { en: 'Delvers', es: 'Excavadores' },
    bands: 5,
    text: {
      en: 'Cave regions cost 1 less; all caves are neighbours.',
      es: 'Las cuevas cuestan 1 menos; todas las cuevas son vecinas.',
    },
  },
  {
    id: 'seers',
    name: { en: 'Seers', es: 'Videntes' },
    bands: 5,
    text: { en: '+1 coin for each spring region.', es: '+1 moneda por cada región con manantial.' },
  },
  {
    id: 'raiders',
    name: { en: 'Raiders', es: 'Saqueadores' },
    bands: 6,
    text: {
      en: 'Regions held by others cost 1 band less.',
      es: 'Las regiones de otros cuestan 1 banda menos.',
    },
  },
];

export const TRAITS: Trait[] = [
  {
    id: 'wealthy',
    name: { en: 'Wealthy', es: 'Ricos' },
    bands: 4,
    text: {
      en: '+7 coins at the end of their first turn.',
      es: '+7 monedas al final de su primer turno.',
    },
  },
  {
    id: 'fierce',
    name: { en: 'Fierce', es: 'Fieros' },
    bands: 4,
    text: {
      en: 'Every region costs 1 band less (at least 1).',
      es: 'Cada región cuesta 1 banda menos (mínimo 1).',
    },
  },
  {
    id: 'highland',
    name: { en: 'Highland', es: 'Montañeses' },
    bands: 4,
    text: {
      en: '+1 coin for each hills or mountain region.',
      es: '+1 moneda por cada región de colinas o montaña.',
    },
  },
  {
    id: 'woodland',
    name: { en: 'Woodland', es: 'Del bosque' },
    bands: 4,
    text: { en: '+1 coin for each forest region.', es: '+1 moneda por cada bosque.' },
  },
  {
    id: 'farming',
    name: { en: 'Farming', es: 'Labradores' },
    bands: 3,
    text: { en: '+1 coin for each farmland region.', es: '+1 moneda por cada región de cultivo.' },
  },
  {
    id: 'mounted',
    name: { en: 'Mounted', es: 'A caballo' },
    bands: 5,
    text: {
      en: 'Hills and farmland cost 1 band less.',
      es: 'Colinas y cultivos cuestan 1 banda menos.',
    },
  },
  {
    id: 'stalwart',
    name: { en: 'Stalwart', es: 'Tenaces' },
    bands: 4,
    text: {
      en: 'May decline at the end of a turn of conquest.',
      es: 'Pueden declinar al final de un turno de conquista.',
    },
  },
  {
    id: 'merciless',
    name: { en: 'Merciless', es: 'Despiadados' },
    bands: 5,
    text: {
      en: 'Defenders they beat lose 2 bands instead of 1.',
      es: 'Los defensores que vencen pierden 2 bandas en vez de 1.',
    },
  },
  {
    id: 'numerous',
    name: { en: 'Numerous', es: 'Numerosos' },
    bands: 6,
    text: { en: 'Only more bands.', es: 'Solo más bandas.' },
  },
  {
    id: 'lucky',
    name: { en: 'Lucky', es: 'Afortunados' },
    bands: 5,
    text: {
      en: 'Their reinforcement die rolls one higher (at most 3).',
      es: 'Su dado de refuerzo saca uno más (máximo 3).',
    },
  },
  {
    id: 'pillaging',
    name: { en: 'Pillaging', es: 'Rapiñadores' },
    bands: 5,
    text: {
      en: '+1 coin for each held region taken this turn.',
      es: '+1 moneda por cada región ocupada tomada este turno.',
    },
  },
  {
    id: 'seafaring',
    name: { en: 'Seafaring', es: 'Marineros' },
    bands: 5,
    text: {
      en: 'Lake-shore regions cost 1 band less.',
      es: 'Las regiones ribereñas cuestan 1 banda menos.',
    },
  },
];

export const TURNS: Record<number, number> = { 2: 10, 3: 10, 4: 9, 5: 8 };
export const START_COINS = 5;
/** Faces of the reinforcement die. */
export const DIE = [0, 0, 0, 1, 2, 3];
