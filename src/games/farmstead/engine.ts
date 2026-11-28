/**
 * Farmstead rules (pure): worker placement on a farm for 2–4 players over twelve rounds. Each
 * round a new action space is revealed, accumulating spaces fill up, and players take turns
 * placing family members on free spaces (each space holds one worker per round) and doing what
 * the space does — gather goods, plough, sow, bake, build rooms and stables, fence pastures,
 * renovate, buy an improvement, grow the family, take animals. After rounds 3, 6, 8, 10 and 12
 * comes the harvest: fields yield, the family must be fed (2 food each, 1 for a newborn; what is
 * missing becomes begging cards) and animals breed. The farm is scored at the end. Round order
 * within a stage and dice-free play: the only chance is the order of round spaces, from the
 * seeded generator stored in the state.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  ANIMALS,
  BEG_VP,
  CELLS,
  CISTERN_ROUNDS,
  EMPTY_CELL_VP,
  FENCED_STABLE_VP,
  FOOD_PER_MEMBER,
  GOODS,
  HARVESTS,
  IMPROVEMENTS,
  MAX_FAMILY,
  MAX_STABLES,
  MEMBER_VP,
  NEIGHBOURS,
  NEXT_MATERIAL,
  OVEN_FOOD,
  OVEN_MAX,
  PASTURE_CAPACITY,
  PASTURE_SIDES,
  ROOM_COST,
  ROOM_VP,
  ROUNDS,
  SCORING,
  SOW,
  SPACES,
  STABLE_COST,
  START_FAMILY,
  START_ROOMS,
  points,
  type Animal,
  type Cook,
  type Good,
  type ImpId,
  type Material,
  type SpaceId,
  type Stock,
} from './world';

export type CellKind = 'empty' | 'room' | 'field' | 'pasture';
export interface Cell {
  kind: CellKind;
  crop: 'grain' | 'veg' | null;
  n: number;
  stable: boolean;
}
export interface Farmer {
  cells: Cell[];
  material: Material;
  members: number;
  /** Members born this round (they eat 1 at a harvest and work from next round). */
  newborns: number;
  /** Workers that may still be placed this round. */
  workers: number;
  goods: Record<Good, number>;
  animals: Record<Animal, number>;
  imps: number[];
  begging: number;
  cistern: number;
}
export type Step = 'build' | 'plough' | 'fence' | 'sow' | 'bake' | 'improve';
export interface Sub {
  space: number;
  steps: Step[];
}
export interface Score {
  fields: number;
  pastures: number;
  grain: number;
  veg: number;
  sheep: number;
  pig: number;
  cow: number;
  empty: number;
  stables: number;
  rooms: number;
  family: number;
  begging: number;
  improvements: number;
  total: number;
}
export type LogEntry =
  | { k: 'round'; r: number; space: number }
  | { k: 'place'; p: number; space: number; got: Stock }
  | { k: 'room'; p: number; cell: number }
  | { k: 'stable'; p: number; cell: number }
  | { k: 'plough'; p: number; cell: number }
  | { k: 'pasture'; p: number; cell: number; cost: number }
  | { k: 'sow'; p: number; cell: number; crop: 'grain' | 'veg' }
  | { k: 'bake'; p: number; n: number; food: number }
  | { k: 'improve'; p: number; imp: number }
  | { k: 'renovate'; p: number; to: Material }
  | { k: 'grow'; p: number }
  | { k: 'cooked'; p: number; food: number; lost: number }
  | { k: 'harvest'; r: number }
  | { k: 'fed'; p: number; begging: number }
  | { k: 'born'; p: number; animal: Animal }
  | { k: 'end'; winners: number[] };

export interface Farm {
  seed: number;
  rng: RngState;
  players: number;
  round: number;
  first: number;
  turn: number;
  phase: 'work' | 'sub' | 'over';
  /** Spaces in play (indices into SPACES), permanent first, then revealed round spaces. */
  open: number[];
  /** Round spaces still to come, in order. */
  future: number[];
  /** Goods lying on each space (indices into SPACES). */
  stock: Stock[];
  /** Who is on each space this round (−1: nobody). */
  occupied: number[];
  ps: Farmer[];
  /** Owner of each improvement (−1: still for sale). */
  impOwner: number[];
  sub: Sub | null;
  scores: Score[] | null;
  winners: number[];
  log: LogEntry[];
}

export type Action =
  | { t: 'place'; space: number }
  | { t: 'room'; cell: number }
  | { t: 'stable'; cell: number }
  | { t: 'plough'; cell: number }
  | { t: 'pasture'; cell: number }
  | { t: 'sow'; cell: number; crop: 'grain' | 'veg' }
  | { t: 'bake'; n: number }
  | { t: 'improve'; imp: number }
  | { t: 'done' };

const zeroGoods = (): Record<Good, number> => ({
  timber: 0,
  clay: 0,
  reed: 0,
  stone: 0,
  grain: 0,
  veg: 0,
  food: 0,
});
const zeroAnimals = (): Record<Animal, number> => ({ sheep: 0, pig: 0, cow: 0 });
export const spaceId = (i: number): SpaceId => SPACES[i]!.id;

// ---------------------------------------------------------------------------------------------
// Set-up

export function newFarm(players: number, seed: number): Farm {
  const rng = new Rng(seed >>> 0);
  const future: number[] = [];
  for (const stage of [1, 2, 3, 4, 5])
    future.push(
      ...rng.shuffle(SPACES.map((s, i) => (s.stage === stage ? i : -1)).filter((i) => i >= 0)),
    );
  const g: Farm = {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    round: 0,
    first: 0,
    turn: 0,
    phase: 'work',
    open: SPACES.map((s, i) => (!s.stage && (s.minPlayers ?? 0) <= players ? i : -1)).filter(
      (i) => i >= 0,
    ),
    future,
    stock: SPACES.map(() => ({})),
    occupied: SPACES.map(() => -1),
    ps: Array.from({ length: players }, (_, p) => ({
      cells: Array.from({ length: CELLS }, (_, c) => ({
        kind: START_ROOMS.includes(c) ? 'room' : 'empty',
        crop: null,
        n: 0,
        stable: false,
      })),
      material: 'wood',
      members: START_FAMILY,
      newborns: 0,
      workers: START_FAMILY,
      goods: { ...zeroGoods(), food: p === 0 ? 2 : 3 },
      animals: zeroAnimals(),
      imps: [],
      begging: 0,
      cistern: 0,
    })),
    impOwner: IMPROVEMENTS.map(() => -1),
    sub: null,
    scores: null,
    winners: [],
    log: [],
  };
  startRound(g);
  return g;
}

function startRound(g: Farm) {
  g.round++;
  const space = g.future.shift()!;
  g.open.push(space);
  g.log.push({ k: 'round', r: g.round, space });
  for (const i of g.open) {
    const acc = SPACES[i]!.accrue;
    if (acc) for (const [k, v] of Object.entries(acc)) add(g.stock[i]!, k, v);
  }
  g.occupied = SPACES.map(() => -1);
  for (const f of g.ps) {
    f.newborns = 0;
    f.workers = f.members;
    if (f.cistern > 0) {
      f.cistern--;
      f.goods.food++;
    }
  }
  g.turn = g.first;
  g.phase = 'work';
}
const add = (s: Stock, k: string, v: number) => {
  (s as Record<string, number>)[k] = ((s as Record<string, number>)[k] ?? 0) + v;
};

// ---------------------------------------------------------------------------------------------
// Queries

export const currentPlayer = (g: Farm) => (g.phase === 'over' ? -1 : g.turn);
export const rooms = (f: Farmer) => f.cells.filter((c) => c.kind === 'room').length;
export const fields = (f: Farmer) => f.cells.filter((c) => c.kind === 'field').length;
export const pastures = (f: Farmer) => f.cells.filter((c) => c.kind === 'pasture').length;
export const stables = (f: Farmer) => f.cells.filter((c) => c.stable).length;
const hasImp = (f: Farmer, id: ImpId) => f.imps.some((i) => IMPROVEMENTS[i]!.id === id);
/** The best cooking rates p has (none without a hearth or range). */
export function cookRates(f: Farmer): Cook | null {
  let best: Cook | null = null;
  for (const i of f.imps) {
    const c = IMPROVEMENTS[i]!.cook;
    if (c && (!best || c.bake > best.bake)) best = c;
  }
  return best;
}
const can = (f: Farmer, cost: Stock) =>
  Object.entries(cost).every(([k, v]) => (f.goods[k as Good] ?? 0) >= (v ?? 0));
const pay = (f: Farmer, cost: Stock) => {
  for (const [k, v] of Object.entries(cost)) f.goods[k as Good] -= v ?? 0;
};

/** How many animals of each kind the farm can house: pastures, unfenced stables, one pet. */
export function housing(f: Farmer, animals: Record<Animal, number>) {
  const pens = f.cells
    .filter((c) => c.kind === 'pasture')
    .map((c) => PASTURE_CAPACITY * (c.stable ? 2 : 1))
    .sort((a, b) => b - a);
  const loose = f.cells.filter((c) => c.stable && c.kind !== 'pasture').length + 1;
  const need = { ...animals };
  for (const cap of pens) {
    const k = ANIMALS.reduce((a, b) => (need[b] > need[a] ? b : a));
    if (need[k] <= 0) break;
    need[k] = Math.max(0, need[k] - cap);
  }
  const left = ANIMALS.reduce((n, k) => n + need[k], 0);
  return Math.max(0, left - loose);
}
export const fits = (f: Farmer, animals: Record<Animal, number>) => housing(f, animals) === 0;

export const roomSpots = (f: Farmer) =>
  f.cells
    .map((_, i) => i)
    .filter(
      (i) =>
        f.cells[i]!.kind === 'empty' &&
        !f.cells[i]!.stable &&
        NEIGHBOURS[i]!.some((j) => f.cells[j]!.kind === 'room'),
    );
export const ploughSpots = (f: Farmer) => {
  const empty = f.cells
    .map((_, i) => i)
    .filter((i) => f.cells[i]!.kind === 'empty' && !f.cells[i]!.stable);
  const near = empty.filter((i) => NEIGHBOURS[i]!.some((j) => f.cells[j]!.kind === 'field'));
  return fields(f) ? near : empty;
};
export const stableSpots = (f: Farmer) =>
  stables(f) >= MAX_STABLES
    ? []
    : f.cells
        .map((_, i) => i)
        .filter((i) => !f.cells[i]!.stable && ['empty', 'pasture'].includes(f.cells[i]!.kind));
export const pastureCost = (f: Farmer, cell: number) =>
  Math.max(
    1,
    PASTURE_SIDES - NEIGHBOURS[cell]!.filter((j) => f.cells[j]!.kind === 'pasture').length,
  );
export const pastureSpots = (f: Farmer) =>
  f.cells
    .map((_, i) => i)
    .filter((i) => f.cells[i]!.kind === 'empty' && f.goods.timber >= pastureCost(f, i));
export const sowSpots = (f: Farmer) =>
  f.cells.map((_, i) => i).filter((i) => f.cells[i]!.kind === 'field' && !f.cells[i]!.crop);
/** Food from baking n grain: an oven first, then the best hearth or range. */
export function bakeFood(f: Farmer, n: number) {
  let food = 0;
  let left = n;
  if (hasImp(f, 'oven')) {
    const k = Math.min(left, OVEN_MAX);
    food += k * OVEN_FOOD;
    left -= k;
  }
  const c = cookRates(f);
  if (left > 0) {
    if (!c) return -1;
    food += left * c.bake;
  }
  return food;
}
const canBake = (f: Farmer) => f.goods.grain > 0 && (hasImp(f, 'oven') || !!cookRates(f));
export const canRenovate = (f: Farmer) => {
  const to = NEXT_MATERIAL[f.material];
  return !!to && can(f, { [goodOf(to)]: rooms(f), reed: 1 });
};
const goodOf = (m: Material): Good => (m === 'wood' ? 'timber' : m);
export const roomCost = (f: Farmer): Stock => ROOM_COST[f.material];
const impAffordable = (g: Farm, p: number) =>
  IMPROVEMENTS.map((_, i) => i).filter(
    (i) => g.impOwner[i] === -1 && can(g.ps[p]!, IMPROVEMENTS[i]!.cost),
  );

function stepPossible(g: Farm, p: number, s: Step) {
  const f = g.ps[p]!;
  switch (s) {
    case 'build':
      return (
        (can(f, roomCost(f)) && roomSpots(f).length > 0) ||
        (can(f, STABLE_COST) && stableSpots(f).length > 0)
      );
    case 'plough':
      return ploughSpots(f).length > 0;
    case 'fence':
      return pastureSpots(f).length > 0;
    case 'sow':
      return sowSpots(f).length > 0 && (f.goods.grain > 0 || f.goods.veg > 0);
    case 'bake':
      return canBake(f);
    case 'improve':
      return impAffordable(g, p).length > 0;
  }
}

/** The steps a space starts. */
function stepsOf(id: SpaceId): Step[] {
  switch (id) {
    case 'plough':
      return ['plough'];
    case 'builder':
      return ['build'];
    case 'meeting':
    case 'renovation':
      return ['improve'];
    case 'fencing':
      return ['fence'];
    case 'sowbake':
      return ['sow', 'bake'];
    case 'fieldwork':
      return ['plough', 'sow'];
    default:
      return [];
  }
}

function spaceUsable(g: Farm, p: number, i: number) {
  const f = g.ps[p]!;
  const id = spaceId(i);
  switch (id) {
    case 'growth':
      return f.members < MAX_FAMILY && rooms(f) > f.members;
    case 'hurried':
      return f.members < MAX_FAMILY;
    case 'renovation':
      return canRenovate(f);
    case 'meeting':
      return true;
    default: {
      const steps = stepsOf(id);
      return steps.length === 0 || steps.some((s) => stepPossible(g, p, s));
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Legal actions

export function legalActions(g: Farm): Action[] {
  const p = currentPlayer(g);
  if (p < 0) return [];
  const f = g.ps[p]!;
  const out: Action[] = [];
  if (g.phase === 'work') {
    for (const i of g.open)
      if (g.occupied[i] === -1 && spaceUsable(g, p, i)) out.push({ t: 'place', space: i });
    return out;
  }
  const step = g.sub!.steps[0]!;
  switch (step) {
    case 'build':
      if (can(f, roomCost(f))) for (const c of roomSpots(f)) out.push({ t: 'room', cell: c });
      if (can(f, STABLE_COST)) for (const c of stableSpots(f)) out.push({ t: 'stable', cell: c });
      break;
    case 'plough':
      for (const c of ploughSpots(f)) out.push({ t: 'plough', cell: c });
      break;
    case 'fence':
      for (const c of pastureSpots(f)) out.push({ t: 'pasture', cell: c });
      break;
    case 'sow':
      for (const c of sowSpots(f)) {
        if (f.goods.grain > 0) out.push({ t: 'sow', cell: c, crop: 'grain' });
        if (f.goods.veg > 0) out.push({ t: 'sow', cell: c, crop: 'veg' });
      }
      break;
    case 'bake':
      for (let n = 1; n <= f.goods.grain; n++) if (bakeFood(f, n) > 0) out.push({ t: 'bake', n });
      break;
    case 'improve':
      for (const i of impAffordable(g, p)) out.push({ t: 'improve', imp: i });
      break;
  }
  out.push({ t: 'done' });
  return out;
}

const same = (a: Action, b: Action) => JSON.stringify(a) === JSON.stringify(b);
export const isLegal = (g: Farm, a: Action) => legalActions(g).some((b) => same(a, b));

// ---------------------------------------------------------------------------------------------
// Applying actions

export function act(state: Farm, a: Action): Farm {
  if (!isLegal(state, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  return apply(state, a);
}

/** Applies an action already known to be legal (the AI's own simulations). */
export function apply(state: Farm, a: Action): Farm {
  const g = structuredClone(state);
  const p = currentPlayer(g);
  const f = g.ps[p]!;
  switch (a.t) {
    case 'place':
      place(g, p, a.space);
      break;
    case 'room':
      pay(f, roomCost(f));
      f.cells[a.cell]!.kind = 'room';
      g.log.push({ k: 'room', p, cell: a.cell });
      break;
    case 'stable':
      pay(f, STABLE_COST);
      f.cells[a.cell]!.stable = true;
      g.log.push({ k: 'stable', p, cell: a.cell });
      break;
    case 'plough':
      f.cells[a.cell]!.kind = 'field';
      g.log.push({ k: 'plough', p, cell: a.cell });
      g.sub!.steps.shift();
      break;
    case 'pasture': {
      const cost = pastureCost(f, a.cell);
      f.goods.timber -= cost;
      f.cells[a.cell]!.kind = 'pasture';
      g.log.push({ k: 'pasture', p, cell: a.cell, cost });
      break;
    }
    case 'sow': {
      const c = f.cells[a.cell]!;
      f.goods[a.crop]--;
      c.crop = a.crop;
      c.n = SOW[a.crop];
      g.log.push({ k: 'sow', p, cell: a.cell, crop: a.crop });
      break;
    }
    case 'bake': {
      const food = bakeFood(f, a.n);
      f.goods.grain -= a.n;
      f.goods.food += food;
      g.log.push({ k: 'bake', p, n: a.n, food });
      g.sub!.steps.shift();
      break;
    }
    case 'improve': {
      const imp = IMPROVEMENTS[a.imp]!;
      pay(f, imp.cost);
      f.imps.push(a.imp);
      g.impOwner[a.imp] = p;
      if (imp.id === 'cistern') f.cistern = CISTERN_ROUNDS;
      g.log.push({ k: 'improve', p, imp: a.imp });
      g.sub!.steps.shift();
      break;
    }
    case 'done':
      g.sub!.steps.shift();
      break;
  }
  if (g.phase === 'sub') advanceSub(g, p);
  return g;
}

function place(g: Farm, p: number, i: number) {
  const f = g.ps[p]!;
  const id = spaceId(i);
  g.occupied[i] = p;
  f.workers--;
  const got: Stock = {};
  const gain = (s: Stock) => {
    for (const [k, v] of Object.entries(s)) {
      if (!v) continue;
      add(got, k, v);
      if ((ANIMALS as readonly string[]).includes(k)) f.animals[k as Animal] += v;
      else f.goods[k as Good] += v;
    }
  };
  if (SPACES[i]!.accrue) {
    gain(g.stock[i]!);
    g.stock[i] = {};
  }
  if (SPACES[i]!.take) gain(SPACES[i]!.take!);
  g.log.push({ k: 'place', p, space: i, got });
  if (ANIMALS.some((k) => got[k])) settle(g, p);
  if (id === 'meeting') g.first = p;
  if (id === 'growth' || id === 'hurried') {
    f.members++;
    f.newborns++;
    g.log.push({ k: 'grow', p });
  }
  if (id === 'renovation') {
    const to = NEXT_MATERIAL[f.material]!;
    pay(f, { [goodOf(to)]: rooms(f), reed: 1 });
    f.material = to;
    g.log.push({ k: 'renovate', p, to });
  }
  const steps = stepsOf(id);
  g.sub = { space: i, steps: [...steps] };
  g.phase = 'sub';
  advanceSub(g, p);
}

/** Skips steps that cannot be done; ends the turn when none are left. */
function advanceSub(g: Farm, p: number) {
  const s = g.sub!;
  while (s.steps.length && !stepPossible(g, p, s.steps[0]!)) s.steps.shift();
  if (s.steps.length) return;
  g.sub = null;
  g.phase = 'work';
  // Animals may have lost their room (a stable or pasture built over, or nothing changed).
  nextTurn(g);
}

/** Keeps the animals that fit; cooks the rest with a hearth or range, else they run off. */
function settle(g: Farm, p: number) {
  const f = g.ps[p]!;
  let food = 0;
  let lost = 0;
  const rates = cookRates(f);
  while (!fits(f, f.animals)) {
    const k = ANIMALS.reduce((a, b) => (f.animals[b] > f.animals[a] ? b : a));
    f.animals[k]--;
    if (rates) food += rates[k];
    else lost++;
  }
  f.goods.food += food;
  if (food || lost) g.log.push({ k: 'cooked', p, food, lost });
}

function nextTurn(g: Farm) {
  for (let k = 1; k <= g.players; k++) {
    const q = (g.turn + k) % g.players;
    if (g.ps[q]!.workers > 0) {
      g.turn = q;
      return;
    }
  }
  endRound(g);
}

function endRound(g: Farm) {
  if (HARVESTS.includes(g.round)) harvest(g);
  if (g.round >= ROUNDS) {
    finish(g);
    return;
  }
  startRound(g);
}

/** Converts goods to food for p, best rates first, sparing what scores and breeds. */
export function feed(f: Farmer) {
  const need = f.members * FOOD_PER_MEMBER - f.newborns;
  const rates = cookRates(f);
  if (hasImp(f, 'weaver')) f.goods.food += Math.min(2, f.animals.sheep);
  if (hasImp(f, 'mill') && f.goods.grain > 0 && f.goods.food < need) {
    f.goods.grain--;
    f.goods.food += 3;
  }
  if (hasImp(f, 'smokehouse') && f.goods.food < need) {
    const k = ANIMALS.reduce((a, b) => (f.animals[b] > f.animals[a] ? b : a));
    if (f.animals[k] > 0) {
      f.animals[k]--;
      f.goods.food += 4;
    }
  }
  const spare = (k: Animal) => f.animals[k] - 2;
  while (f.goods.food < need) {
    // Grain (baked if possible), then animals beyond a breeding pair, vegetables, the rest.
    const bake = bakeFood(f, 1);
    if (f.goods.grain > 1) {
      f.goods.grain--;
      f.goods.food += bake > 0 ? bake : 1;
      continue;
    }
    const extra = rates ? ANIMALS.filter((k) => spare(k) > 0) : [];
    if (extra.length) {
      const k = extra.reduce((a, b) => (rates![b] > rates![a] ? b : a));
      f.animals[k]--;
      f.goods.food += rates![k];
      continue;
    }
    if (f.goods.veg > 0) {
      f.goods.veg--;
      f.goods.food += rates ? rates.veg : 1;
      continue;
    }
    if (f.goods.grain > 0) {
      f.goods.grain--;
      f.goods.food += bake > 0 ? bake : 1;
      continue;
    }
    const any = rates ? ANIMALS.filter((k) => f.animals[k] > 0) : [];
    if (any.length) {
      const k = any.reduce((a, b) => (rates![b] > rates![a] ? b : a));
      f.animals[k]--;
      f.goods.food += rates![k];
      continue;
    }
    break;
  }
  const paid = Math.min(need, f.goods.food);
  f.goods.food -= paid;
  const short = need - paid;
  f.begging += short;
  return short;
}

function harvest(g: Farm) {
  g.log.push({ k: 'harvest', r: g.round });
  g.ps.forEach((f, p) => {
    for (const c of f.cells)
      if (c.crop && c.n > 0) {
        f.goods[c.crop]++;
        c.n--;
        if (c.n === 0) c.crop = null;
      }
    const short = feed(f);
    g.log.push({ k: 'fed', p, begging: short });
    for (const k of ANIMALS) {
      if (f.animals[k] < 2) continue;
      const next = { ...f.animals, [k]: f.animals[k] + 1 };
      if (fits(f, next)) {
        f.animals = next;
        g.log.push({ k: 'born', p, animal: k });
      }
    }
  });
}

export function scoreFarm(f: Farmer): Score {
  const inFields = (crop: 'grain' | 'veg') =>
    f.cells.reduce((n, c) => n + (c.crop === crop ? c.n : 0), 0);
  const s: Score = {
    fields: points(SCORING.fields, fields(f)),
    pastures: points(SCORING.pastures, pastures(f)),
    grain: points(SCORING.grain, f.goods.grain + inFields('grain')),
    veg: points(SCORING.veg, f.goods.veg + inFields('veg')),
    sheep: points(SCORING.sheep, f.animals.sheep),
    pig: points(SCORING.pig, f.animals.pig),
    cow: points(SCORING.cow, f.animals.cow),
    empty: f.cells.filter((c) => c.kind === 'empty' && !c.stable).length * EMPTY_CELL_VP,
    stables: f.cells.filter((c) => c.stable && c.kind === 'pasture').length * FENCED_STABLE_VP,
    rooms: rooms(f) * ROOM_VP[f.material],
    family: f.members * MEMBER_VP,
    begging: f.begging * BEG_VP,
    improvements: f.imps.reduce((n, i) => n + IMPROVEMENTS[i]!.vp, 0),
    total: 0,
  };
  if (hasImp(f, 'bench'))
    s.improvements +=
      f.goods.timber >= 6 ? 3 : f.goods.timber >= 4 ? 2 : f.goods.timber >= 2 ? 1 : 0;
  s.total = (Object.keys(s) as (keyof Score)[])
    .filter((k) => k !== 'total')
    .reduce((n, k) => n + s[k], 0);
  return s;
}

function finish(g: Farm) {
  g.scores = g.ps.map(scoreFarm);
  const key = (p: number) => g.scores![p]!.total * 1000 + g.ps[p]!.goods.food;
  const best = Math.max(...g.ps.map((_, p) => key(p)));
  g.winners = g.ps.map((_, p) => p).filter((p) => key(p) === best);
  g.phase = 'over';
  g.log.push({ k: 'end', winners: g.winners });
}

// ---------------------------------------------------------------------------------------------
// Validation

export function isValidFarm(d: unknown): d is Farm {
  if (typeof d !== 'object' || d === null) return false;
  const g = d as Farm;
  if (![2, 3, 4].includes(g.players)) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  if (!['work', 'sub', 'over'].includes(g.phase)) return false;
  if (!Number.isInteger(g.round) || g.round < 1 || g.round > ROUNDS) return false;
  const isSpace = (x: unknown) =>
    Number.isInteger(x) && (x as number) >= 0 && (x as number) < SPACES.length;
  if (!Array.isArray(g.open) || !g.open.every(isSpace)) return false;
  if (!Array.isArray(g.future) || !g.future.every(isSpace)) return false;
  if (
    g.open.length + g.future.length !==
    SPACES.filter((s) => s.stage || (s.minPlayers ?? 0) <= g.players).length
  )
    return false;
  if (!Array.isArray(g.stock) || g.stock.length !== SPACES.length) return false;
  if (!Array.isArray(g.occupied) || g.occupied.length !== SPACES.length) return false;
  if (!Array.isArray(g.impOwner) || g.impOwner.length !== IMPROVEMENTS.length) return false;
  if (!Array.isArray(g.ps) || g.ps.length !== g.players) return false;
  for (const f of g.ps) {
    if (!Array.isArray(f.cells) || f.cells.length !== CELLS) return false;
    if (
      !f.cells.every(
        (c) =>
          ['empty', 'room', 'field', 'pasture'].includes(c.kind) &&
          Number.isInteger(c.n) &&
          c.n >= 0,
      )
    )
      return false;
    if (!['wood', 'clay', 'stone'].includes(f.material)) return false;
    if (!Number.isInteger(f.members) || f.members < START_FAMILY || f.members > MAX_FAMILY)
      return false;
    if (f.members > Math.max(rooms(f), START_FAMILY) + 3) return false;
    if (!GOODS.every((k) => Number.isInteger(f.goods?.[k]) && f.goods[k] >= 0)) return false;
    if (!ANIMALS.every((k) => Number.isInteger(f.animals?.[k]) && f.animals[k] >= 0)) return false;
    if (!fits(f, f.animals)) return false;
    if (!Array.isArray(f.imps)) return false;
  }
  if ((g.phase === 'sub') !== (g.sub !== null)) return false;
  return Array.isArray(g.log) && Array.isArray(g.winners);
}
