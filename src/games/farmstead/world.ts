/**
 * Farmstead content, all invented for this game: twelve rounds in five stages with harvests
 * after rounds 3, 6, 8, 10 and 12; permanent and stage action spaces (some accumulate goods each
 * round); a 3×5 farmyard; eight improvements; the cooking rates; the farm scoring table.
 */
import type { LocalizedText } from '../../core/i18n';

export const GOODS = ['timber', 'clay', 'reed', 'stone', 'grain', 'veg', 'food'] as const;
export type Good = (typeof GOODS)[number];
export const ANIMALS = ['sheep', 'pig', 'cow'] as const;
export type Animal = (typeof ANIMALS)[number];
export type Stock = Partial<Record<Good | Animal, number>>;

export const ROWS = 3;
export const COLS = 5;
export const CELLS = ROWS * COLS;
export const cellRC = (c: number): [number, number] => [Math.floor(c / COLS), c % COLS];
export const NEIGHBOURS: number[][] = Array.from({ length: CELLS }, (_, c) => {
  const [r, k] = cellRC(c);
  return [
    [r - 1, k],
    [r + 1, k],
    [r, k - 1],
    [r, k + 1],
  ]
    .filter(([a, b]) => a! >= 0 && a! < ROWS && b! >= 0 && b! < COLS)
    .map(([a, b]) => a! * COLS + b!);
});
/** The two rooms every farm starts with (left column, middle and bottom). */
export const START_ROOMS = [5, 10];
export const START_FAMILY = 2;
export const MAX_FAMILY = 5;
export const MAX_STABLES = 4;
export const ROUNDS = 12;
export const HARVESTS = [3, 6, 8, 10, 12];

export type SpaceId =
  | 'forest'
  | 'claypit'
  | 'reedbank'
  | 'pond'
  | 'labour'
  | 'seeds'
  | 'plough'
  | 'builder'
  | 'meeting'
  | 'copse'
  | 'traders'
  | 'sheepfair'
  | 'fencing'
  | 'sowbake'
  | 'growth'
  | 'quarry'
  | 'renovation'
  | 'vegseeds'
  | 'pigfair'
  | 'cattlefair'
  | 'deepquarry'
  | 'hurried'
  | 'fieldwork';

export interface SpaceDef {
  id: SpaceId;
  name: LocalizedText;
  /** Goods added every round (accumulating spaces). */
  accrue?: Stock;
  /** Goods taken straight away (fixed spaces). */
  take?: Stock;
  /** Fewest players for the space to be in play. */
  minPlayers?: number;
  /** Stage (1–5) for round spaces; permanent spaces have none. */
  stage?: number;
}

export const SPACES: SpaceDef[] = [
  { id: 'forest', name: { en: 'Forest', es: 'Bosque' }, accrue: { timber: 3 } },
  { id: 'claypit', name: { en: 'Clay Pit', es: 'Barrera' }, accrue: { clay: 1 } },
  { id: 'reedbank', name: { en: 'Reed Bank', es: 'Juncal' }, accrue: { reed: 1 } },
  { id: 'pond', name: { en: 'Fishing Pond', es: 'Estanque' }, accrue: { food: 1 } },
  { id: 'labour', name: { en: 'Day Labour', es: 'Jornal' }, take: { food: 2 } },
  { id: 'seeds', name: { en: 'Grain Seeds', es: 'Semillas de cereal' }, take: { grain: 1 } },
  { id: 'plough', name: { en: 'Ploughing', es: 'Arado' } },
  { id: 'builder', name: { en: 'Builder', es: 'Albañil' } },
  { id: 'meeting', name: { en: 'Village Meeting', es: 'Concejo' } },
  { id: 'copse', name: { en: 'Copse', es: 'Arboleda' }, accrue: { timber: 2 }, minPlayers: 3 },
  {
    id: 'traders',
    name: { en: 'Traders', es: 'Buhoneros' },
    take: { clay: 1, reed: 1, food: 1 },
    minPlayers: 4,
  },
  {
    id: 'sheepfair',
    name: { en: 'Sheep Fair', es: 'Feria de ovejas' },
    accrue: { sheep: 1 },
    stage: 1,
  },
  { id: 'fencing', name: { en: 'Fencing', es: 'Vallado' }, stage: 1 },
  { id: 'sowbake', name: { en: 'Sow and Bake', es: 'Sembrar y hornear' }, stage: 1 },
  { id: 'growth', name: { en: 'Family Growth', es: 'Crecer la familia' }, stage: 2 },
  { id: 'quarry', name: { en: 'Stone Quarry', es: 'Cantera' }, accrue: { stone: 1 }, stage: 2 },
  { id: 'renovation', name: { en: 'Renovation', es: 'Reforma' }, stage: 2 },
  {
    id: 'vegseeds',
    name: { en: 'Vegetable Seeds', es: 'Semillas de hortaliza' },
    take: { veg: 1 },
    stage: 3,
  },
  { id: 'pigfair', name: { en: 'Pig Fair', es: 'Feria de cerdos' }, accrue: { pig: 1 }, stage: 3 },
  {
    id: 'cattlefair',
    name: { en: 'Cattle Fair', es: 'Feria de vacas' },
    accrue: { cow: 1 },
    stage: 4,
  },
  {
    id: 'deepquarry',
    name: { en: 'Deep Quarry', es: 'Cantera honda' },
    accrue: { stone: 1 },
    stage: 4,
  },
  { id: 'hurried', name: { en: 'Hurried Growth', es: 'Crecimiento apresurado' }, stage: 5 },
  { id: 'fieldwork', name: { en: 'Field Work', es: 'Faena del campo' }, stage: 5 },
];
export const spaceIndex = (id: SpaceId) => SPACES.findIndex((s) => s.id === id);
/** Rounds of each stage. */
export const STAGE_ROUNDS: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8],
  4: [9, 10],
  5: [11, 12],
};

// ---------------------------------------------------------------------------------------------
// Building

export type Material = 'wood' | 'clay' | 'stone';
/** A room costs 5 of the house's material and 2 reed; a stable 2 timber. */
export const ROOM_COST: Record<Material, Stock> = {
  wood: { timber: 5, reed: 2 },
  clay: { clay: 5, reed: 2 },
  stone: { stone: 5, reed: 2 },
};
export const STABLE_COST: Stock = { timber: 2 };
/** Renovating costs 1 of the new material per room and 1 reed. */
export const NEXT_MATERIAL: Partial<Record<Material, Material>> = { wood: 'clay', clay: 'stone' };
/** A pasture costs 4 timber, 1 less for each side it shares with an existing pasture. */
export const PASTURE_SIDES = 4;
export const PASTURE_CAPACITY = 2;
export const SOW: Record<'grain' | 'veg', number> = { grain: 3, veg: 2 };

// ---------------------------------------------------------------------------------------------
// Improvements

export type ImpId =
  | 'hearth'
  | 'hearth2'
  | 'range'
  | 'range2'
  | 'oven'
  | 'smokehouse'
  | 'weaver'
  | 'bench'
  | 'mill'
  | 'cistern';
export interface Cook {
  veg: number;
  sheep: number;
  pig: number;
  cow: number;
  /** Food per grain baked, and how many grain may be baked at once. */
  bake: number;
  bakeMax: number;
}
export interface ImpDef {
  id: ImpId;
  name: LocalizedText;
  cost: Stock;
  vp: number;
  cook?: Cook;
  text: LocalizedText;
}
const hearth: Cook = { veg: 2, sheep: 2, pig: 2, cow: 3, bake: 2, bakeMax: 99 };
const range: Cook = { veg: 3, sheep: 2, pig: 3, cow: 4, bake: 3, bakeMax: 99 };
export const IMPROVEMENTS: ImpDef[] = [
  {
    id: 'hearth',
    name: { en: 'Hearth', es: 'Hogar' },
    cost: { clay: 2 },
    vp: 1,
    cook: hearth,
    text: {
      en: 'Cook: vegetable 2, sheep 2, pig 2, cow 3. Bake: grain 2.',
      es: 'Cocina: hortaliza 2, oveja 2, cerdo 2, vaca 3. Hornea: cereal 2.',
    },
  },
  {
    id: 'hearth2',
    name: { en: 'Hearth', es: 'Hogar' },
    cost: { clay: 3 },
    vp: 1,
    cook: hearth,
    text: {
      en: 'Cook: vegetable 2, sheep 2, pig 2, cow 3. Bake: grain 2.',
      es: 'Cocina: hortaliza 2, oveja 2, cerdo 2, vaca 3. Hornea: cereal 2.',
    },
  },
  {
    id: 'range',
    name: { en: 'Kitchen Range', es: 'Fogón' },
    cost: { clay: 4 },
    vp: 1,
    cook: range,
    text: {
      en: 'Cook: vegetable 3, sheep 2, pig 3, cow 4. Bake: grain 3.',
      es: 'Cocina: hortaliza 3, oveja 2, cerdo 3, vaca 4. Hornea: cereal 3.',
    },
  },
  {
    id: 'range2',
    name: { en: 'Kitchen Range', es: 'Fogón' },
    cost: { clay: 5 },
    vp: 1,
    cook: range,
    text: {
      en: 'Cook: vegetable 3, sheep 2, pig 3, cow 4. Bake: grain 3.',
      es: 'Cocina: hortaliza 3, oveja 2, cerdo 3, vaca 4. Hornea: cereal 3.',
    },
  },
  {
    id: 'oven',
    name: { en: 'Bread Oven', es: 'Horno de pan' },
    cost: { clay: 2, stone: 2 },
    vp: 2,
    text: {
      en: 'Bake up to 2 grain for 4 food each.',
      es: 'Hornea hasta 2 de cereal por 4 de comida cada uno.',
    },
  },
  {
    id: 'smokehouse',
    name: { en: 'Smokehouse', es: 'Ahumadero' },
    cost: { timber: 2, stone: 1 },
    vp: 1,
    text: {
      en: 'Each harvest you may turn 1 animal into 4 food.',
      es: 'En cada cosecha puedes convertir 1 animal en 4 de comida.',
    },
  },
  {
    id: 'weaver',
    name: { en: 'Weaver', es: 'Telar' },
    cost: { reed: 2, timber: 1 },
    vp: 1,
    text: {
      en: 'Each harvest: 1 food per sheep you keep (at most 2).',
      es: 'En cada cosecha: 1 de comida por oveja que tengas (2 como mucho).',
    },
  },
  {
    id: 'bench',
    name: { en: 'Carpenter’s Bench', es: 'Banco de carpintero' },
    cost: { timber: 2, stone: 1 },
    vp: 1,
    text: {
      en: 'At the end: 1/2/3 more points for 2/4/6 timber.',
      es: 'Al final: 1/2/3 puntos más por 2/4/6 de madera.',
    },
  },
  {
    id: 'mill',
    name: { en: 'Mill', es: 'Molino' },
    cost: { timber: 2, stone: 2 },
    vp: 2,
    text: {
      en: 'Each harvest you may turn 1 grain into 3 food.',
      es: 'En cada cosecha puedes convertir 1 de cereal en 3 de comida.',
    },
  },
  {
    id: 'cistern',
    name: { en: 'Cistern', es: 'Aljibe' },
    cost: { stone: 2, clay: 1 },
    vp: 3,
    text: {
      en: '1 food at the start of each of the next 4 rounds.',
      es: '1 de comida al empezar cada una de las 4 rondas siguientes.',
    },
  },
];
export const impIndex = (id: ImpId) => IMPROVEMENTS.findIndex((x) => x.id === id);
export const CISTERN_ROUNDS = 4;
export const OVEN_FOOD = 4;
export const OVEN_MAX = 2;

// ---------------------------------------------------------------------------------------------
// Scoring

/** Points for a count: the first threshold reached from the top gives that many points. */
export type Table = { at: number; pts: number }[];
const table = (zero: number, ...steps: [number, number][]): Table => [
  { at: 0, pts: zero },
  ...steps.map(([at, pts]) => ({ at, pts })),
];
export const SCORING: Record<'fields' | 'pastures' | 'grain' | 'veg' | Animal, Table> = {
  fields: table(-1, [2, 1], [3, 2], [4, 3], [5, 4]),
  pastures: table(-1, [1, 1], [2, 2], [3, 3], [4, 4]),
  grain: table(-1, [1, 1], [4, 2], [6, 3], [8, 4]),
  veg: table(-1, [1, 1], [2, 2], [3, 3], [4, 4]),
  sheep: table(-1, [1, 1], [3, 2], [5, 3], [7, 4]),
  pig: table(-1, [1, 1], [3, 2], [5, 3], [6, 4]),
  cow: table(-1, [1, 1], [2, 2], [4, 3], [5, 4]),
};
export const points = (t: Table, n: number) =>
  t.reduce((best, s) => (n >= s.at ? s.pts : best), t[0]!.pts);
export const MEMBER_VP = 3;
export const BEG_VP = -3;
export const EMPTY_CELL_VP = -1;
export const ROOM_VP: Record<Material, number> = { wood: 0, clay: 1, stone: 2 };
export const FENCED_STABLE_VP = 1;
export const FOOD_PER_MEMBER = 2;
