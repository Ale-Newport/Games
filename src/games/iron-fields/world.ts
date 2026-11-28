/**
 * Iron Fields content, all invented for this game: a hex land of 37 spaces around the Foundry,
 * five factions with homes, starting power and an ability, four player boards (each pairs the
 * four top actions with the four bottom actions differently), costs and rewards, upgrades, mech
 * abilities, structures, recruits, encounter cards, stars and the end scoring tiers.
 */
import type { LocalizedText } from '../../core/i18n';

// ---------------------------------------------------------------------------------------------
// The land

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
    let q = -ring;
    let r = ring;
    for (let side = 0; side < 6; side++)
      for (let step = 0; step < ring; step++) {
        out.push([q, r]);
        q += dirs[side]![0];
        r += dirs[side]![1];
      }
  }
  return out;
})();
const key = (q: number, r: number) => `${q},${r}`;
const INDEX = new Map(POS.map(([q, r], i) => [key(q, r), i]));
export const at = (q: number, r: number) => INDEX.get(key(q, r))!;
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
export const hexXY = (i: number): [number, number] => {
  const [q, r] = POS[i]!;
  return [Math.sqrt(3) * (q + r / 2), 1.5 * r];
};
export const FOUNDRY = 0;
/** Home corners for each player count (corners of the outer ring). */
export const CORNERS = [at(3, 0), at(3, -3), at(0, -3), at(-3, 0), at(-3, 3), at(0, 3)];
export const HOME_CORNERS: Record<number, number[]> = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4] };

export type Terrain =
  'farm' | 'forest' | 'mountain' | 'tundra' | 'village' | 'lake' | 'foundry' | 'home';
export const RES = ['oil', 'metal', 'food', 'wood'] as const;
export type Res = (typeof RES)[number];
/** What a worker produces on each terrain (villages make workers). */
export const PRODUCES: Partial<Record<Terrain, Res>> = {
  farm: 'food',
  forest: 'wood',
  mountain: 'metal',
  tundra: 'oil',
};
/** Terrains dealt on the 30 or so remaining spaces, per seed. */
export const TERRAIN_POOL: Terrain[] = [
  ...Array<Terrain>(6).fill('farm'),
  ...Array<Terrain>(6).fill('forest'),
  ...Array<Terrain>(6).fill('mountain'),
  ...Array<Terrain>(6).fill('tundra'),
  ...Array<Terrain>(4).fill('village'),
  ...Array<Terrain>(4).fill('lake'),
];
export const ENCOUNTER_SPOTS = 6;
/** Territories a structure or the Foundry counts as at the end. */
export const FOUNDRY_WORTH = 3;

// ---------------------------------------------------------------------------------------------
// Factions and boards

export type FactionId = 'ashen' | 'thorn' | 'salt' | 'crown' | 'ember';
export interface Faction {
  id: FactionId;
  name: LocalizedText;
  power: number;
  ability: LocalizedText;
}
export const FACTIONS: Faction[] = [
  {
    id: 'ashen',
    name: { en: 'Ashen League', es: 'Liga Cenicienta' },
    power: 3,
    ability: {
      en: 'Forgewrights: deploying a mech costs 1 metal less.',
      es: 'Forjadores: desplegar un robot cuesta 1 de metal menos.',
    },
  },
  {
    id: 'thorn',
    name: { en: 'Thornwood', es: 'Bosque Espino' },
    power: 2,
    ability: {
      en: 'Rootbound: workers on forests produce 1 more wood.',
      es: 'Arraigados: los obreros en bosques producen 1 de madera más.',
    },
  },
  {
    id: 'salt',
    name: { en: 'Saltmarch Union', es: 'Unión de Salmarjal' },
    power: 3,
    ability: {
      en: 'Tidewalkers: all its units may cross lakes.',
      es: 'Caminamareas: todas sus unidades pueden cruzar lagos.',
    },
  },
  {
    id: 'crown',
    name: { en: 'Highcrown', es: 'Altacorona' },
    power: 5,
    ability: {
      en: 'Vanguard: +2 to its total when it attacks.',
      es: 'Vanguardia: +2 a su total cuando ataca.',
    },
  },
  {
    id: 'ember',
    name: { en: 'Emberfold', es: 'Brasaplegada' },
    power: 1,
    ability: {
      en: 'Merchants: trading gives 3 resources instead of 2.',
      es: 'Mercaderes: comerciar da 3 recursos en vez de 2.',
    },
  },
];

export const TOPS = ['move', 'trade', 'produce', 'bolster'] as const;
export type Top = (typeof TOPS)[number];
export const BOTTOMS = ['upgrade', 'deploy', 'build', 'enlist'] as const;
export type Bottom = (typeof BOTTOMS)[number];
/** What each bottom action costs (and the least it can cost after upgrades), what it pays, and in what. */
export const BOTTOM: Record<Bottom, { res: Res; cost: number; min: number; coins: number }> = {
  upgrade: { res: 'oil', cost: 2, min: 1, coins: 1 },
  deploy: { res: 'metal', cost: 2, min: 1, coins: 0 },
  build: { res: 'wood', cost: 2, min: 1, coins: 2 },
  enlist: { res: 'food', cost: 3, min: 1, coins: 1 },
};
export interface Board {
  id: string;
  name: LocalizedText;
  /** Bottom action under each top action (move, trade, produce, bolster). */
  bottoms: Bottom[];
  popularity: number;
  coins: number;
}
export const BOARDS: Board[] = [
  {
    id: 'a',
    name: { en: 'Industrial', es: 'Industrial' },
    bottoms: ['upgrade', 'deploy', 'build', 'enlist'],
    popularity: 2,
    coins: 4,
  },
  {
    id: 'b',
    name: { en: 'Engineering', es: 'Ingeniería' },
    bottoms: ['deploy', 'build', 'enlist', 'upgrade'],
    popularity: 3,
    coins: 3,
  },
  {
    id: 'c',
    name: { en: 'Patriotic', es: 'Patriótico' },
    bottoms: ['build', 'enlist', 'upgrade', 'deploy'],
    popularity: 4,
    coins: 2,
  },
  {
    id: 'd',
    name: { en: 'Mechanical', es: 'Mecánico' },
    bottoms: ['enlist', 'upgrade', 'deploy', 'build'],
    popularity: 1,
    coins: 5,
  },
];

/**
 * Top-action improvements an upgrade may unlock (6 in all): move a third unit, trade for 2
 * popularity, produce on a third and fourth space, bolster for 3 and then 4 power.
 */
export const TOP_STEPS: Record<Top, number> = { move: 1, trade: 1, produce: 2, bolster: 2 };
export const MAX_UPGRADES = 6;

// ---------------------------------------------------------------------------------------------
// Units, structures, recruits

export const MAX_WORKERS = 8;
export const START_WORKERS = 2;
export const MECHS = 4;
/** What each mech deployed unlocks for the character and mechs, in order. */
export const MECH_ABILITIES = ['stride', 'ford', 'bulwark', 'strike'] as const;
export type MechAbility = (typeof MECH_ABILITIES)[number];
export const STRUCTURES = ['mill', 'monument', 'armory', 'mine'] as const;
export type Structure = (typeof STRUCTURES)[number];
export const RECRUITS = ['power', 'coins', 'popularity', 'supplies'] as const;
export type Recruit = (typeof RECRUITS)[number];

export const MAX_POWER = 16;
export const MAX_POPULARITY = 18;
export const MAX_BID = 7;
export const START_POWER_BONUS = 0;

// ---------------------------------------------------------------------------------------------
// Encounters

export interface Reward {
  coins?: number;
  popularity?: number;
  power?: number;
  res?: Partial<Record<Res, number>>;
  worker?: boolean;
  /** Paid first. */
  pay?: { coins?: number; popularity?: number };
}
export interface Encounter {
  id: string;
  name: LocalizedText;
  options: [Reward, Reward, Reward];
}
export const ENCOUNTERS: Encounter[] = [
  {
    id: 'caravan',
    name: { en: 'Stranded Caravan', es: 'Caravana varada' },
    options: [{ coins: 3 }, { res: { food: 2, wood: 2 } }, { pay: { coins: 2 }, popularity: 3 }],
  },
  {
    id: 'smiths',
    name: { en: 'Wandering Smiths', es: 'Herreros errantes' },
    options: [{ res: { metal: 3 } }, { power: 2, coins: 1 }, { pay: { popularity: 2 }, coins: 5 }],
  },
  {
    id: 'refugees',
    name: { en: 'Refugees', es: 'Refugiados' },
    options: [{ worker: true }, { popularity: 2 }, { pay: { coins: 1 }, popularity: 2, power: 1 }],
  },
  {
    id: 'oilseep',
    name: { en: 'Oil Seep', es: 'Filtración de petróleo' },
    options: [
      { res: { oil: 3 } },
      { coins: 2, popularity: 1 },
      { pay: { popularity: 1 }, res: { oil: 2, metal: 2 } },
    ],
  },
  {
    id: 'festival',
    name: { en: 'Harvest Festival', es: 'Fiesta de la cosecha' },
    options: [
      { popularity: 3 },
      { res: { food: 3 } },
      { pay: { coins: 3 }, popularity: 2, worker: true },
    ],
  },
  {
    id: 'scouts',
    name: { en: 'Old Scouts', es: 'Viejos exploradores' },
    options: [{ power: 3 }, { coins: 2, res: { wood: 1 } }, { pay: { coins: 2 }, power: 4 }],
  },
  {
    id: 'mill',
    name: { en: 'Abandoned Mill', es: 'Molino abandonado' },
    options: [
      { res: { wood: 2, food: 1 } },
      { coins: 2 },
      { pay: { popularity: 1 }, coins: 2, power: 2 },
    ],
  },
  {
    id: 'convoy',
    name: { en: 'Convoy Wreck', es: 'Convoy siniestrado' },
    options: [
      { res: { metal: 2, oil: 1 } },
      { power: 2 },
      { pay: { coins: 1 }, res: { metal: 2, oil: 2 } },
    ],
  },
];

/** Foundry bonus for a player's character, once: coins and power. */
export const FOUNDRY_BONUS: Reward = { coins: 3, power: 2 };

// ---------------------------------------------------------------------------------------------
// Stars and scoring

export type StarId =
  'upgrades' | 'mechs' | 'structures' | 'recruits' | 'workers' | 'power' | 'popularity' | 'combat';
export const STARS_TO_END = 5;
/** What earns each star (combat: each win, at most COMBAT_STARS). */
export const STAR_AT = {
  upgrades: 5,
  mechs: 4,
  structures: 4,
  recruits: 4,
  workers: 6,
  power: 12,
  popularity: 14,
} as const;
export const COMBAT_STARS = 2;
/** Coins per star, per territory and per 2 resources at each popularity tier. */
export const TIERS = [
  { upTo: 6, star: 3, territory: 2, resources: 1 },
  { upTo: 12, star: 4, territory: 3, resources: 2 },
  { upTo: 18, star: 5, territory: 4, resources: 3 },
];
export const MAX_TURNS = 30;
