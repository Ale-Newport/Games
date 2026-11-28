/**
 * Planet Shapers content, all invented for this game: the planet Kepra (a hex map of 37 spaces
 * with ten sea basins and printed bonuses), three global parameters (heat, air, seas), six
 * resources with production, six corporations, 57 project cards (automatic, events, actions,
 * effects), standard projects, five milestones and five awards.
 */
import type { LocalizedText } from '../../core/i18n';

export const RES = ['credits', 'ore', 'crystal', 'flora', 'power', 'heat'] as const;
export type Res = (typeof RES)[number];
export type Amounts = Partial<Record<Res, number>>;
export type Tag = 'build' | 'space' | 'science' | 'plant' | 'power' | 'city' | 'event';
export const TAGS: Tag[] = ['build', 'space', 'science', 'plant', 'power', 'city', 'event'];
export type Param = 'heat' | 'air' | 'sea';
export const PARAMS: Param[] = ['heat', 'air', 'sea'];
/** Steps of each parameter (from 0). */
export const MAX: Record<Param, number> = { heat: 10, air: 8, sea: 7 };
/** Heat steps that raise the raiser's heat production, the heat step that brings a sea, the air step that raises heat. */
export const HEAT_PROD_STEPS = [3, 6];
export const HEAT_SEA_STEP = 8;
export const AIR_HEAT_STEP = 5;
export const START_TR = 20;
export const MAX_GEN = 14;
export const MIN_CREDIT_PROD = -5;

// ---------------------------------------------------------------------------------------------
// The map of Kepra

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

/** Ten basins where seas may go: a long rift valley across the planet. */
export const BASINS: number[] = [
  [-3, 2],
  [-2, 2],
  [-2, 1],
  [-1, 1],
  [0, 0],
  [0, -1],
  [1, -1],
  [1, -2],
  [2, -2],
  [-1, 3],
].map(([q, r]) => at(q!, r!));
/** Printed bonuses (what you gain for placing a tile there). */
export const BONUS: Amounts[] = POS.map(() => ({}));
const bonus: [number, number, Amounts | 'card'][] = [
  [3, -3, { ore: 2 }],
  [2, -3, { ore: 1 }],
  [3, -2, { ore: 1 }],
  [1, -3, { crystal: 1 }],
  [0, -3, { crystal: 2 }],
  [-1, -2, { flora: 1 }],
  [-1, -1, { flora: 2 }],
  [-2, 0, { flora: 2 }],
  [-3, 1, { flora: 1 }],
  [-3, 3, { flora: 1 }],
  [-2, 3, { flora: 2 }],
  [0, 1, { flora: 1 }],
  [1, 0, { ore: 1 }],
  [2, 0, { ore: 2 }],
  [3, 0, { crystal: 1 }],
  [0, 3, { crystal: 1 }],
  [1, 2, { ore: 1 }],
  [-1, 2, 'card'],
  [2, 1, 'card'],
  [-3, 0, 'card'],
];
/** Spaces whose bonus is a card. */
export const CARD_BONUS = new Set<number>();
for (const [q, r, b] of bonus)
  if (b === 'card') CARD_BONUS.add(at(q, r));
  else BONUS[at(q, r)] = b;

// ---------------------------------------------------------------------------------------------
// Corporations

export type CorpId = 'verdance' | 'forgeline' | 'skyreach' | 'thermos' | 'meridian' | 'archive';
export interface Corp {
  id: CorpId;
  name: LocalizedText;
  credits: number;
  prod: Amounts;
  text: LocalizedText;
}
export const CORPS: Corp[] = [
  {
    id: 'verdance',
    name: { en: 'Verdance', es: 'Verdancia' },
    credits: 38,
    prod: { flora: 1 },
    text: {
      en: '38 credits, +1 flora production. A grove from flora costs 7 flora instead of 8.',
      es: '38 créditos, +1 de producción de flora. Una arboleda con flora cuesta 7 en vez de 8.',
    },
  },
  {
    id: 'forgeline',
    name: { en: 'Forgeline', es: 'Forjalínea' },
    credits: 40,
    prod: { ore: 1 },
    text: {
      en: '40 credits, +1 ore production. Ore is worth 3 credits on Build cards instead of 2.',
      es: '40 créditos, +1 de producción de mineral. El mineral vale 3 en cartas de Obra en vez de 2.',
    },
  },
  {
    id: 'skyreach',
    name: { en: 'Skyreach', es: 'Altocielo' },
    credits: 38,
    prod: { crystal: 1 },
    text: {
      en: '38 credits, +1 crystal production. Crystal is worth 4 credits on Space cards instead of 3.',
      es: '38 créditos, +1 de producción de cristal. El cristal vale 4 en cartas Espaciales en vez de 3.',
    },
  },
  {
    id: 'thermos',
    name: { en: 'Thermos Collective', es: 'Colectivo Termos' },
    credits: 40,
    prod: { heat: 2 },
    text: {
      en: '40 credits, +2 heat production. Raising heat with heat costs 7 instead of 8.',
      es: '40 créditos, +2 de producción de calor. Subir el calor con calor cuesta 7 en vez de 8.',
    },
  },
  {
    id: 'meridian',
    name: { en: 'Meridian Union', es: 'Unión Meridiana' },
    credits: 46,
    prod: { credits: 1 },
    text: {
      en: '46 credits, +1 credit production. Gets 4 credits back on any card or standard project costing 20 or more.',
      es: '46 créditos, +1 de producción de créditos. Recupera 4 créditos en cada carta o proyecto estándar de 20 o más.',
    },
  },
  {
    id: 'archive',
    name: { en: 'Archive Institute', es: 'Instituto Archivo' },
    credits: 40,
    prod: {},
    text: {
      en: '40 credits. Sees 5 cards each research instead of 4 and buys them for 2 credits instead of 3.',
      es: '40 créditos. Ve 5 cartas en cada investigación en vez de 4 y las compra por 2 créditos en vez de 3.',
    },
  },
];
export const corpIndex = (id: CorpId) => CORPS.findIndex((c) => c.id === id);

// ---------------------------------------------------------------------------------------------
// Project cards

export type CardKind = 'auto' | 'event' | 'action' | 'effect';
export interface Req {
  param?: Param;
  min?: number;
  max?: number;
  tag?: Tag;
  count?: number;
}
export interface CardAction {
  pay?: Amounts;
  gain?: Amounts;
  raise?: Partial<Record<Param, number>>;
  draw?: number;
}
export interface CardEffect {
  /** Cards (with this tag, or any card) cost this much less. */
  discount?: { tag?: Tag; n: number };
  /** Whenever you play a card with this tag (this one included), gain this. */
  onTag?: { tag: Tag; gain: Amounts };
}
export interface CardDef {
  id: string;
  name: LocalizedText;
  cost: number;
  tags: Tag[];
  kind: CardKind;
  req?: Req;
  prod?: Amounts;
  gain?: Amounts;
  raise?: Partial<Record<Param, number>>;
  tiles?: ('grove' | 'settlement')[];
  tr?: number;
  draw?: number;
  vp?: number;
  action?: CardAction;
  effect?: CardEffect;
}

const c = (
  id: string,
  en: string,
  es: string,
  cost: number,
  tags: Tag[],
  rest: Partial<CardDef> = {},
): CardDef => ({
  id,
  name: { en, es },
  cost,
  tags,
  kind: tags.includes('event') ? 'event' : rest.action ? 'action' : rest.effect ? 'effect' : 'auto',
  ...rest,
});

export const CARDS: CardDef[] = [
  // Power
  c('wind-rows', 'Wind Rows', 'Hileras eólicas', 6, ['power'], {
    req: { param: 'air', min: 3 },
    prod: { power: 1 },
    vp: 1,
  }),
  c('geo-bore', 'Geothermal Bore', 'Pozo geotérmico', 10, ['power', 'build'], {
    prod: { power: 2 },
  }),
  c('fusion-cell', 'Fusion Cell', 'Celda de fusión', 16, ['power', 'science'], {
    req: { tag: 'science', count: 2 },
    prod: { power: 3 },
  }),
  c('orbital-collector', 'Orbital Collector', 'Colector orbital', 14, ['space', 'power'], {
    prod: { power: 2, heat: 1 },
  }),
  c('tidal-dam', 'Tidal Dam', 'Presa de mareas', 12, ['power', 'build'], {
    req: { param: 'sea', min: 3 },
    prod: { power: 2 },
    vp: 1,
  }),
  // Heat
  c('heat-lattice', 'Heat Lattice', 'Retícula térmica', 8, ['build'], { prod: { heat: 2 } }),
  c('core-tap', 'Core Tap', 'Toma del núcleo', 16, ['build', 'power'], {
    prod: { heat: 3, power: 1 },
  }),
  c('sunshade', 'Sunshade Array', 'Pantalla solar', 18, ['space'], {
    raise: { heat: 1 },
    prod: { heat: 2 },
  }),
  c('comet', 'Comet Strike', 'Impacto de cometa', 14, ['space', 'event'], {
    raise: { heat: 1 },
    gain: { heat: 2 },
  }),
  c('ice-comet', 'Ice Comet', 'Cometa de hielo', 21, ['space', 'event'], {
    raise: { heat: 1, sea: 1 },
  }),
  c('big-impact', 'Great Impact', 'Gran impacto', 28, ['space', 'event'], {
    raise: { heat: 2 },
    gain: { crystal: 2 },
  }),
  c('bombard', 'Asteroid Bombard', 'Bombardeo de asteroides', 13, ['space', 'event'], {
    raise: { heat: 1 },
    gain: { crystal: 1 },
  }),
  c('magma-vent', 'Magma Vents', 'Respiraderos de magma', 11, ['build'], {
    req: { param: 'heat', max: 6 },
    prod: { heat: 2 },
    gain: { heat: 3 },
  }),
  // Seas
  c('aquifer-drill', 'Aquifer Drill', 'Perforación de acuífero', 16, ['build', 'event'], {
    raise: { sea: 1 },
  }),
  c('polar-melt', 'Polar Melt', 'Deshielo polar', 12, ['event'], {
    req: { param: 'heat', min: 6 },
    raise: { sea: 1 },
  }),
  c('rain-seeding', 'Rain Seeding', 'Siembra de lluvia', 18, ['science'], {
    req: { param: 'heat', min: 4 },
    raise: { sea: 1 },
    prod: { flora: 1 },
  }),
  c('glacier-tow', 'Glacier Tow', 'Remolque de glaciar', 25, ['space', 'event'], {
    raise: { sea: 2 },
  }),
  c('spring-network', 'Spring Network', 'Red de manantiales', 14, ['build'], {
    req: { param: 'sea', min: 2 },
    raise: { sea: 1 },
  }),
  // Air
  c('oxygen-works', 'Oxygen Works', 'Planta de oxígeno', 15, ['build'], {
    raise: { air: 1 },
    prod: { power: -1 },
  }),
  c('photon-splitter', 'Photon Splitter', 'Fotodisociador', 20, ['science', 'power'], {
    raise: { air: 1 },
    prod: { credits: 1 },
  }),
  c('algae-mats', 'Algae Mats', 'Esteras de algas', 10, ['plant'], {
    req: { param: 'sea', min: 2 },
    prod: { flora: 1 },
    gain: { flora: 2 },
  }),
  c('air-scrubbers', 'Air Scrubbers', 'Depuradoras de aire', 23, ['build', 'science'], {
    raise: { air: 2 },
    prod: { power: -1 },
  }),
  // Plants
  c('moss', 'Moss Carpets', 'Alfombras de musgo', 8, ['plant'], {
    req: { param: 'heat', min: 2 },
    prod: { flora: 1 },
    vp: 1,
  }),
  c('fern-bloom', 'Fern Bloom', 'Floración de helechos', 13, ['plant'], {
    req: { param: 'sea', min: 3 },
    prod: { flora: 2 },
  }),
  c('tree-nursery', 'Tree Nursery', 'Vivero', 16, ['plant', 'build'], {
    req: { param: 'heat', min: 5 },
    prod: { flora: 2 },
    gain: { flora: 2 },
  }),
  c('forest-charter', 'Forest Charter', 'Carta forestal', 20, ['plant'], {
    tiles: ['grove'],
    prod: { flora: 1 },
  }),
  c('seed-bank', 'Seed Bank', 'Banco de semillas', 9, ['plant', 'science'], { gain: { flora: 5 } }),
  c('pollinators', 'Pollinators', 'Polinizadores', 12, ['plant'], {
    req: { param: 'air', min: 4 },
    prod: { flora: 2 },
    vp: 1,
  }),
  c('frost-algae', 'Frost Algae', 'Algas de escarcha', 7, ['plant'], {
    req: { param: 'heat', max: 5 },
    prod: { flora: 1 },
    gain: { flora: 1 },
  }),
  c('lichen', 'Lichen Spread', 'Expansión de líquenes', 6, ['plant', 'event'], {
    req: { param: 'air', min: 2 },
    gain: { flora: 3 },
  }),
  // Economy
  c('trade-hub', 'Trade Hub', 'Centro comercial', 18, ['build'], { prod: { credits: 3 } }),
  c('orbital-bank', 'Orbital Bank', 'Banco orbital', 16, ['space'], {
    prod: { credits: 2 },
    vp: 1,
  }),
  c('ore-quarry', 'Ore Quarry', 'Cantera de mineral', 6, ['build'], { prod: { ore: 1 } }),
  c('deep-mine', 'Deep Mine', 'Mina profunda', 13, ['build'], {
    req: { param: 'heat', min: 2 },
    prod: { ore: 2 },
  }),
  c('asteroid-claim', 'Asteroid Claim', 'Concesión de asteroide', 10, ['space'], {
    prod: { crystal: 1 },
  }),
  c('ring-refinery', 'Ring Refinery', 'Refinería de anillos', 16, ['space', 'build'], {
    prod: { crystal: 1, ore: 1 },
  }),
  c('research-grant', 'Research Grant', 'Beca de investigación', 10, ['science'], { draw: 2 }),
  c('think-tank', 'Think Tank', 'Laboratorio de ideas', 7, ['science'], { draw: 1, vp: 1 }),
  c('shuttle-port', 'Shuttle Port', 'Puerto de lanzaderas', 14, ['space', 'build'], {
    prod: { credits: 1, crystal: 1 },
  }),
  c('supply-drop', 'Supply Drop', 'Lanzamiento de suministros', 8, ['space', 'event'], {
    gain: { ore: 3, crystal: 2 },
  }),
  // Settlements
  c('dome-town', 'Dome Town', 'Ciudad cúpula', 18, ['build', 'city'], {
    tiles: ['settlement'],
    prod: { credits: 2, power: -1 },
  }),
  c('canal-city', 'Canal City', 'Ciudad de canales', 22, ['build', 'city'], {
    req: { param: 'sea', min: 3 },
    tiles: ['settlement'],
    prod: { credits: 3, power: -1 },
  }),
  c('crater-habitat', 'Crater Habitat', 'Hábitat de cráter', 14, ['build', 'city'], {
    tiles: ['settlement'],
    prod: { credits: 1 },
  }),
  // Points
  c('monument', 'Founders’ Monument', 'Monumento fundacional', 12, ['build'], { vp: 2 }),
  c('ark-archive', 'Ark Archive', 'Archivo arca', 20, ['science', 'space'], { vp: 3 }),
  c('bureau', 'Shaping Bureau', 'Oficina de terraformación', 22, ['science'], { tr: 2 }),
  // Actions
  c('water-pump', 'Water Pump', 'Bomba de agua', 12, ['build'], {
    action: { pay: { credits: 8 }, raise: { sea: 1 } },
  }),
  c('power-broker', 'Power Broker', 'Bróker de energía', 7, ['power'], {
    action: { pay: { power: 1 }, gain: { credits: 2 } },
  }),
  c('greenhouse', 'Greenhouse', 'Invernadero', 9, ['plant', 'build'], {
    action: { pay: { power: 1 }, gain: { flora: 1 } },
  }),
  c('atmo-pump', 'Atmosphere Pump', 'Bomba atmosférica', 14, ['build'], {
    action: { pay: { power: 3 }, raise: { air: 1 } },
  }),
  c('space-elevator', 'Space Elevator', 'Ascensor espacial', 22, ['space', 'build'], {
    prod: { crystal: 1 },
    action: { pay: { ore: 1 }, gain: { credits: 5 } },
    vp: 1,
  }),
  c('lab-station', 'Lab Station', 'Estación laboratorio', 11, ['science'], {
    action: { pay: { power: 1 }, draw: 1 },
  }),
  // Effects
  c('shipyard', 'Orbital Shipyard', 'Astillero orbital', 10, ['space'], {
    effect: { discount: { tag: 'space', n: 2 } },
  }),
  c('builders-guild', 'Builders’ Guild', 'Gremio de constructores', 9, ['build'], {
    effect: { discount: { tag: 'build', n: 2 } },
  }),
  c('science-council', 'Science Council', 'Consejo científico', 12, ['science'], {
    effect: { discount: { n: 1 } },
    vp: 1,
  }),
  c('arboretum', 'Arboretum', 'Arboreto', 11, ['plant'], {
    effect: { onTag: { tag: 'plant', gain: { flora: 2 } } },
  }),
  c('grid-operator', 'Grid Operator', 'Operador de red', 12, ['power', 'build'], {
    effect: { onTag: { tag: 'power', gain: { credits: 3 } } },
  }),
];
export const cardIndex = (id: string) => CARDS.findIndex((x) => x.id === id);

// ---------------------------------------------------------------------------------------------
// Standard projects, milestones, awards

export type StdId = 'power' | 'heater' | 'aquifer' | 'grove' | 'settlement';
export const STD: { id: StdId; cost: number }[] = [
  { id: 'power', cost: 11 },
  { id: 'heater', cost: 14 },
  { id: 'aquifer', cost: 18 },
  { id: 'grove', cost: 23 },
  { id: 'settlement', cost: 25 },
];
export const GROVE_FLORA = 8;
export const HEAT_HEAT = 8;
export const CARD_PRICE = 3;
export const RESEARCH = 4;
export const START_CARDS = 10;

export type MilestoneId = 'shaper' | 'mayor' | 'planter' | 'builder' | 'scholar';
export const MILESTONES: MilestoneId[] = ['shaper', 'mayor', 'planter', 'builder', 'scholar'];
export const MILESTONE_COST = 8;
export const MILESTONE_VP = 5;
export const MAX_CLAIMED = 3;
export type AwardId = 'landlord' | 'banker' | 'scientist' | 'thermalist' | 'miner';
export const AWARDS: AwardId[] = ['landlord', 'banker', 'scientist', 'thermalist', 'miner'];
export const AWARD_COSTS = [8, 14, 20];
