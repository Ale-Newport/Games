/**
 * Star Council content, all invented for this game: a hex galaxy of radius 3 (37 systems) around
 * the Nexus, six factions with home systems and an ability each, a pool of 36 system tiles
 * (planets with resources and influence, empty space, nebulae, rifts and asteroid fields), five
 * unit types, six strategy cards, eight technologies, eighteen public objectives and twelve
 * council agendas. The galaxy is dealt per seed in `engine.ts` (`dealGalaxy`).
 */
import type { LocalizedText } from '../../core/i18n';

/** Axial hex coordinates of every position, ring by ring from the Nexus (index 0). */
export const RADIUS = 3;
export const POS: [number, number][] = (() => {
  const out: [number, number][] = [[0, 0]];
  const dirs: [number, number][] = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];
  for (let ring = 1; ring <= RADIUS; ring++) {
    // Start at direction 4 times ring, walk each of the six sides.
    let q = dirs[4]![0] * ring;
    let r = dirs[4]![1] * ring;
    for (let side = 0; side < 6; side++)
      for (let step = 0; step < ring; step++) {
        out.push([q, r]);
        q += dirs[side]![0];
        r += dirs[side]![1];
      }
  }
  return out;
})();
export const NEXUS = 0;
const key = (q: number, r: number) => `${q},${r}`;
const INDEX = new Map(POS.map(([q, r], i) => [key(q, r), i]));
/** Neighbouring positions of each position. */
export const ADJ: number[][] = POS.map(([q, r]) =>
  (
    [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ] as const
  )
    .map(([dq, dr]) => INDEX.get(key(q + dq, r + dr)))
    .filter((x): x is number => x !== undefined),
);
/** Screen position (pointy-top hexes of size 1). */
export const hexXY = (i: number): [number, number] => {
  const [q, r] = POS[i]!;
  return [Math.sqrt(3) * (q + r / 2), 1.5 * r];
};
/** The six corner positions of the outer ring, clockwise. */
export const CORNERS: number[] = [
  [3, 0],
  [3, -3],
  [0, -3],
  [-3, 0],
  [-3, 3],
  [0, 3],
].map(([q, r]) => INDEX.get(key(q!, r!))!);
/** Home corners used for each player count. */
export const HOME_CORNERS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
};

export interface PlanetDef {
  name: string;
  r: number;
  i: number;
}
export type TileKind = 'planets' | 'empty' | 'nebula' | 'rift' | 'field' | 'home' | 'nexus';
export interface TileDef {
  id: string;
  kind: TileKind;
  /** Indices into PLANETS. */
  planets: number[];
}

/** Every planet in the game: the Nexus, six faction homes, then the pool. */
export const PLANETS: PlanetDef[] = [];
const addPlanets = (ps: [string, number, number][]) =>
  ps.map(([name, r, i]) => PLANETS.push({ name, r, i }) - 1);

export const NEXUS_PLANET = addPlanets([['Concord', 1, 4]])[0]!;
/** Neutral wardens guarding Concord at the start; they hit on 7. */
export const WARDENS = 2;

export type FactionId = 'vey' | 'oru' | 'hesh' | 'lumen' | 'tal' | 'ixa';
export interface Faction {
  id: FactionId;
  name: LocalizedText;
  ability: LocalizedText;
  home: number[];
}
export const FACTIONS: Faction[] = [
  {
    id: 'vey',
    name: { en: 'Vey Collective', es: 'Colectivo Vey' },
    ability: {
      en: 'Scholars: starts with Ion Drives; following Research costs 2 resources instead of 4.',
      es: 'Eruditos: empieza con Motores iónicos; seguir Investigación cuesta 2 recursos en vez de 4.',
    },
    home: addPlanets([
      ['Vey Prime', 4, 2],
      ['Vey Minor', 1, 1],
    ]),
  },
  {
    id: 'oru',
    name: { en: 'Oru Syndicate', es: 'Sindicato Oru' },
    ability: {
      en: 'Traders: starts with 3 trade goods; gains 1 more whenever Commerce gives it trade goods.',
      es: 'Mercaderes: empieza con 3 mercancías; gana 1 más cada vez que Comercio le da mercancías.',
    },
    home: addPlanets([['Orumar', 5, 3]]),
  },
  {
    id: 'hesh',
    name: { en: 'Hesh Ascendancy', es: 'Ascendencia Hesh' },
    ability: {
      en: 'Raiders: its ships hit on 1 less in the first round of every space battle.',
      es: 'Asaltantes: sus naves impactan con 1 menos en la primera ronda de cada batalla espacial.',
    },
    home: addPlanets([
      ['Hesh Anvil', 3, 1],
      ['Hesh Spire', 2, 2],
    ]),
  },
  {
    id: 'lumen',
    name: { en: 'Lumen Choir', es: 'Coro Lumen' },
    ability: {
      en: 'Orators: 3 extra votes on every agenda.',
      es: 'Oradores: 3 votos más en cada propuesta del consejo.',
    },
    home: addPlanets([['Lumenar', 3, 4]]),
  },
  {
    id: 'tal',
    name: { en: 'Tal Wardens', es: 'Guardianes Tal' },
    ability: {
      en: 'Stalwart: its infantry hit on 1 less when defending a planet; starts with 2 more infantry.',
      es: 'Firmes: su infantería impacta con 1 menos al defender un planeta; empieza con 2 infantes más.',
    },
    home: addPlanets([
      ['Talgard', 4, 2],
      ['Talrest', 1, 1],
    ]),
  },
  {
    id: 'ixa',
    name: { en: 'Ixa Drift', es: 'Deriva Ixa' },
    ability: {
      en: 'Wanderers: carriers move 1 more; its ships ignore nebulae.',
      es: 'Errantes: sus portanaves mueven 1 más; sus naves ignoran las nebulosas.',
    },
    home: addPlanets([
      ['Ixa Wake', 3, 2],
      ['Ixa Shoal', 2, 1],
    ]),
  },
];
export const factionIndex = (id: FactionId) => FACTIONS.findIndex((f) => f.id === id);

const planetTiles: [string, number, number][][] = [
  [['Orrin', 2, 1]],
  [['Kesh', 1, 2]],
  [['Velloa', 3, 1]],
  [['Tamsin', 1, 3]],
  [['Ruun', 2, 2]],
  [['Ilex', 4, 0]],
  [['Corvo', 0, 4]],
  [['Maret', 3, 2]],
  [
    ['Sabble', 1, 1],
    ['Quill', 2, 0],
  ],
  [
    ['Dovan', 2, 1],
    ['Esker', 0, 2],
  ],
  [
    ['Fennic', 1, 2],
    ['Gorsa', 1, 1],
  ],
  [
    ['Halden', 3, 0],
    ['Isra', 0, 3],
  ],
  [['Kalto', 2, 2]],
  [['Lyss', 1, 3]],
  [['Mordu', 3, 1]],
  [
    ['Nemis', 2, 0],
    ['Ottra', 1, 1],
  ],
  [['Pell', 4, 1]],
  [['Rasque', 1, 4]],
  [['Seline', 2, 3]],
  [['Ubrin', 3, 3]],
  [
    ['Vasha', 1, 0],
    ['Wend', 0, 1],
    ['Xylo', 1, 1],
  ],
  [['Yarrow', 2, 1]],
  [['Zenn', 1, 2]],
  [
    ['Abriel', 2, 2],
    ['Brask', 1, 0],
  ],
];
/** The 36 dealable tiles: 24 with planets, 6 empty, 2 nebulae, 2 rifts, 2 asteroid fields. */
export const POOL: TileDef[] = [
  ...planetTiles.map((ps, k) => ({
    id: `p${k + 1}`,
    kind: 'planets' as const,
    planets: addPlanets(ps),
  })),
  ...[1, 2, 3, 4, 5, 6].map((k) => ({ id: `e${k}`, kind: 'empty' as const, planets: [] })),
  { id: 'n1', kind: 'nebula', planets: [] },
  { id: 'n2', kind: 'nebula', planets: [] },
  { id: 'r1', kind: 'rift', planets: [] },
  { id: 'r2', kind: 'rift', planets: [] },
  { id: 'f1', kind: 'field', planets: [] },
  { id: 'f2', kind: 'field', planets: [] },
];
export const TILES: TileDef[] = [
  { id: 'nexus', kind: 'nexus', planets: [NEXUS_PLANET] },
  ...FACTIONS.map((f) => ({ id: `h-${f.id}`, kind: 'home' as const, planets: f.home })),
  ...POOL,
];
export const tileById = (id: string) => TILES.find((t) => t.id === id)!;

/** Units: cost, combat (hits on this or more on a d10), move, capacity. */
export type Kind = 'fighter' | 'cruiser' | 'carrier' | 'dread' | 'infantry';
export const KINDS: Kind[] = ['infantry', 'fighter', 'cruiser', 'carrier', 'dread'];
export const SHIPS: Kind[] = ['fighter', 'cruiser', 'carrier', 'dread'];
export interface UnitDef {
  cost: number;
  combat: number;
  move: number;
  capacity: number;
  supply: number;
}
export const UNITS: Record<Kind, UnitDef> = {
  infantry: { cost: 1, combat: 8, move: 0, capacity: 0, supply: 14 },
  fighter: { cost: 1, combat: 9, move: 0, capacity: 0, supply: 10 },
  cruiser: { cost: 2, combat: 7, move: 2, capacity: 0, supply: 6 },
  carrier: { cost: 3, combat: 9, move: 1, capacity: 4, supply: 4 },
  dread: { cost: 4, combat: 5, move: 1, capacity: 1, supply: 4 },
};
/** Non-fighter ships one player may keep in a system. */
export const FLEET_LIMIT = 4;
export const DOCKS = 3;
/** Opening forces in the home system. */
export const START_UNITS: Record<Kind, number> = {
  infantry: 3,
  fighter: 2,
  cruiser: 1,
  carrier: 1,
  dread: 1,
};
export const START_TOKENS = 4;
export const STATUS_TOKENS = 2;
export const MAX_TOKENS = 12;

/** Strategy cards, by initiative (1 first). */
export type CardId = 'command' | 'accord' | 'commerce' | 'industry' | 'research' | 'dominion';
export const CARDS: CardId[] = [
  'command',
  'accord',
  'commerce',
  'industry',
  'research',
  'dominion',
];

export type TechId =
  'ion' | 'hull' | 'drills' | 'envoy' | 'warp' | 'wings' | 'assault' | 'logistics';
/** Tier-1 techs need nothing; tier-2 techs need two technologies already owned. */
export const TECHS: { id: TechId; tier: 1 | 2 }[] = [
  { id: 'ion', tier: 1 },
  { id: 'hull', tier: 1 },
  { id: 'drills', tier: 1 },
  { id: 'envoy', tier: 1 },
  { id: 'warp', tier: 2 },
  { id: 'wings', tier: 2 },
  { id: 'assault', tier: 2 },
  { id: 'logistics', tier: 2 },
];
export const TECH_IDS = TECHS.map((x) => x.id);

/**
 * Public objectives. `spend` objectives are paid when scored; the rest are conditions checked by
 * `meets` in the engine.
 */
export type ObjectiveId =
  | 'planets6'
  | 'res9'
  | 'inf9'
  | 'tech2'
  | 'ships4'
  | 'docks2'
  | 'spendRes5'
  | 'spendInf5'
  | 'frontier'
  | 'spendTg4'
  | 'planets10'
  | 'tech5'
  | 'nexus'
  | 'ships6'
  | 'spendRes10'
  | 'spendInf10'
  | 'dreads3'
  | 'strike';
export interface ObjectiveDef {
  id: ObjectiveId;
  stage: 1 | 2;
  spend?: { res?: number; inf?: number; tg?: number };
}
export const OBJECTIVES: ObjectiveDef[] = [
  { id: 'planets6', stage: 1 },
  { id: 'res9', stage: 1 },
  { id: 'inf9', stage: 1 },
  { id: 'tech2', stage: 1 },
  { id: 'ships4', stage: 1 },
  { id: 'docks2', stage: 1 },
  { id: 'spendRes5', stage: 1, spend: { res: 5 } },
  { id: 'spendInf5', stage: 1, spend: { inf: 5 } },
  { id: 'frontier', stage: 1 },
  { id: 'spendTg4', stage: 1, spend: { tg: 4 } },
  { id: 'planets10', stage: 2 },
  { id: 'tech5', stage: 2 },
  { id: 'nexus', stage: 2 },
  { id: 'ships6', stage: 2 },
  { id: 'spendRes10', stage: 2, spend: { res: 10 } },
  { id: 'spendInf10', stage: 2, spend: { inf: 10 } },
  { id: 'dreads3', stage: 2 },
  { id: 'strike', stage: 2 },
];
export const objectiveIndex = (id: ObjectiveId) => OBJECTIVES.findIndex((o) => o.id === id);
/** Points for an objective of each stage. */
export const STAGE_VP = { 1: 1, 2: 2 } as const;
/** Rounds whose status phase reveals a stage-I objective; later ones reveal stage II. */
export const STAGE1_ROUNDS = 3;

/** Council agendas: “for/against” decisions or elections of a player. */
export type AgendaId =
  | 'lanes'
  | 'shipwright'
  | 'laureate'
  | 'tribute'
  | 'censure'
  | 'fleet'
  | 'mining'
  | 'disarm'
  | 'archives'
  | 'mandate'
  | 'watch'
  | 'charter';
export const AGENDAS: { id: AgendaId; elect: boolean }[] = [
  { id: 'lanes', elect: false },
  { id: 'shipwright', elect: false },
  { id: 'laureate', elect: true },
  { id: 'tribute', elect: true },
  { id: 'censure', elect: true },
  { id: 'fleet', elect: false },
  { id: 'mining', elect: false },
  { id: 'disarm', elect: false },
  { id: 'archives', elect: false },
  { id: 'mandate', elect: true },
  { id: 'watch', elect: false },
  { id: 'charter', elect: true },
];
export const agendaIndex = (id: AgendaId) => AGENDAS.findIndex((a) => a.id === id);

export const TARGETS = [7, 10] as const;
export const MAX_ROUNDS = 8;
