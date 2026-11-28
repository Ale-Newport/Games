/**
 * Star Council rules (pure): a galactic 4X for 2–4 players. Each round has a strategy phase
 * (pick strategy cards), an action phase (activate systems to move, fight, invade and produce;
 * play strategy cards whose secondary the others may follow; pass), a status phase (score public
 * objectives, the Nexus pays a point, new objective, command tokens, planets ready) and — once
 * someone has taken the Nexus — a council vote on an agenda. First to the target score wins;
 * after the last round the most points win. Dice and decks come from the seeded generator stored
 * in the state.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  ADJ,
  AGENDAS,
  CARDS,
  CORNERS,
  DOCKS,
  FACTIONS,
  FLEET_LIMIT,
  HOME_CORNERS,
  KINDS,
  MAX_ROUNDS,
  MAX_TOKENS,
  NEXUS,
  NEXUS_PLANET,
  OBJECTIVES,
  PLANETS,
  POOL,
  POS,
  SHIPS,
  STAGE1_ROUNDS,
  STAGE_VP,
  START_TOKENS,
  START_UNITS,
  STATUS_TOKENS,
  TECHS,
  TECH_IDS,
  TILES,
  UNITS,
  WARDENS,
  type Kind,
  type TechId,
  type TileKind,
} from './world';

export interface Fleet {
  fighter: number;
  cruiser: number;
  carrier: number;
  dread: number;
  /** Infantry carried in space. */
  infantry: number;
  /** Dreadnoughts that have taken their one sustained hit. */
  damaged: number;
}
export interface PlanetState {
  id: number;
  sys: number;
  /** Player, −1 nobody, −2 the Nexus wardens. */
  owner: number;
  inf: number;
  ready: boolean;
  dock: boolean;
}
export interface Player {
  faction: number;
  vp: number;
  tokens: number;
  tg: number;
  techs: TechId[];
  /** Strategy cards held this round (indices into CARDS) and those already played. */
  cards: number[];
  played: number[];
  passed: boolean;
  scored: number[];
}
export type Step = 'move' | 'space' | 'land' | 'build';
export interface Activation {
  sys: number;
  step: Step;
  /** Systems a carrier or dreadnought came from in this activation (they can bring fighters / infantry). */
  from: number[];
  bombarded: boolean;
  queue: Kind[];
}
export interface Dice {
  a: number[];
  d: number[];
  ah: number;
  dh: number;
}
export interface Battle {
  defender: number;
  round: number;
  last: Dice | null;
}
export interface Follow {
  card: number;
  by: number;
  queue: number[];
}
export interface Council {
  agenda: number;
  queue: number[];
  votes: { p: number; option: number; n: number }[];
}
export type Phase = 'strategy' | 'action' | 'follow' | 'status' | 'council' | 'over';

export type LogEntry =
  | { k: 'round'; r: number }
  | { k: 'pick'; p: number; card: number; tg: number }
  | { k: 'activate'; p: number; sys: number }
  | { k: 'battle'; p: number; d: number; sys: number; won: boolean | null }
  | { k: 'retreat'; p: number; sys: number; to: number }
  | { k: 'ground'; p: number; planet: number; from: number; won: boolean }
  | { k: 'claim'; p: number; planet: number }
  | { k: 'build'; p: number; sys: number; n: number; cost: number }
  | { k: 'play'; p: number; card: number; x: number }
  | { k: 'follow'; p: number; card: number; x: number }
  | { k: 'pass'; p: number }
  | { k: 'score'; p: number; obj: number; vp: number }
  | { k: 'seat'; p: number }
  | { k: 'throne'; p: number }
  | { k: 'reveal'; obj: number }
  | { k: 'agenda'; agenda: number; option: number; votes: number }
  | { k: 'end'; winners: number[] };

export interface Star {
  seed: number;
  rng: RngState;
  players: number;
  target: number;
  round: number;
  maxRounds: number;
  speaker: number;
  phase: Phase;
  ps: Player[];
  /** Tile id at each position. */
  tiles: string[];
  /** Ships in space: [system][player]. */
  space: Fleet[][];
  planets: PlanetState[];
  /** Command tokens on the board: [system][player]. */
  tokens: boolean[][];
  revealed: number[];
  deck1: number[];
  deck2: number[];
  agendas: number[];
  laws: number[];
  nexusTaken: boolean;
  /** Trade goods resting on each unpicked strategy card. */
  cardTg: number[];
  /** Players still to pick (strategy) or to score (status). */
  queue: number[];
  /** Initiative order for this round. */
  order: number[];
  turn: number;
  act: Activation | null;
  battle: Battle | null;
  follow: Follow | null;
  council: Council | null;
  winners: number[];
  log: LogEntry[];
}

export type Action =
  | { t: 'pick'; card: number }
  | { t: 'activate'; sys: number }
  | { t: 'move'; from: number; kind: Kind; n: number }
  | { t: 'done' }
  | { t: 'roll' }
  | { t: 'retreat' }
  | { t: 'land'; planet: number; n: number }
  | { t: 'build'; kind: Kind }
  | { t: 'unbuild'; kind: Kind }
  | { t: 'play'; card: number; x: number }
  | { t: 'follow'; x: number }
  | { t: 'decline' }
  | { t: 'pass' }
  | { t: 'score'; obj: number }
  | { t: 'skip' }
  | { t: 'vote'; option: number }
  | { t: 'abstain' };

// ---------------------------------------------------------------------------------------------
// Lookups

const TILE_AT = new Map(TILES.map((t) => [t.id, t]));
export const tileAt = (g: Star, s: number) => TILE_AT.get(g.tiles[s]!)!;
export const kindAt = (g: Star, s: number): TileKind => tileAt(g, s).kind;
export const planetsIn = (g: Star, s: number) => g.planets.filter((pl) => pl.sys === s);
export const planet = (g: Star, id: number) => g.planets.find((pl) => pl.id === id);
export const emptyFleet = (): Fleet => ({
  fighter: 0,
  cruiser: 0,
  carrier: 0,
  dread: 0,
  infantry: 0,
  damaged: 0,
});
export const combatShips = (f: Fleet) => f.fighter + f.cruiser + f.carrier + f.dread;
export const bigShips = (f: Fleet) => f.cruiser + f.carrier + f.dread;
export const has = (g: Star, p: number, t: TechId) => g.ps[p]!.techs.includes(t);
export const factionOf = (g: Star, p: number) => FACTIONS[g.ps[p]!.faction]!;
const fid = (g: Star, p: number) => factionOf(g, p).id;
const law = (g: Star, id: string) => g.laws.some((a) => AGENDAS[a]!.id === id);
export const homeOf = (g: Star, p: number) => CORNERS[HOME_CORNERS[g.players]![p]!]!;
export const owned = (g: Star, p: number) => g.planets.filter((pl) => pl.owner === p);
export const cardIndex = (id: (typeof CARDS)[number]) => CARDS.indexOf(id);

export function capacityOf(g: Star, p: number, f: Fleet) {
  return f.carrier * (has(g, p, 'wings') ? 6 : 4) + f.dread * UNITS.dread.capacity;
}
export const fleetLimit = (g: Star, p: number) => FLEET_LIMIT + (has(g, p, 'logistics') ? 1 : 0);
export function moveOf(g: Star, p: number, k: Kind) {
  let m = UNITS[k].move;
  if (m === 0) return 0;
  if (has(g, p, 'ion') && (k === 'cruiser' || k === 'carrier')) m++;
  if (has(g, p, 'warp') && k === 'dread') m++;
  if (fid(g, p) === 'ixa' && k === 'carrier') m++;
  if (law(g, 'lanes')) m++;
  return m;
}
const ignoresNebula = (g: Star, p: number) => fid(g, p) === 'ixa' || has(g, p, 'warp');
/** The other player with ships in system s, or −1. */
export function enemyAt(g: Star, p: number, s: number) {
  for (let q = 0; q < g.players; q++) if (q !== p && combatShips(g.space[s]![q]!) > 0) return q;
  return -1;
}
/** Hit thresholds on a d10. */
export function hitOn(g: Star, p: number, k: Kind, ctx: 'space' | 'attack' | 'defend' | 'bomb') {
  if (p === -2) return 7;
  let v = UNITS[k].combat;
  if (k === 'fighter' && has(g, p, 'wings')) v = 8;
  if ((k === 'cruiser' || k === 'dread') && has(g, p, 'hull')) v--;
  if (k === 'infantry') {
    if (has(g, p, 'assault')) v = 7;
    if (ctx === 'defend' && fid(g, p) === 'tal') v--;
  }
  return v;
}

/** Cheapest path cost (rifts cost nothing; fields block; enemy ships and nebulae stop movement). */
export function distance(g: Star, p: number, from: number, to: number) {
  const n = POS.length;
  const dist = new Array<number>(n).fill(Infinity);
  dist[from] = 0;
  const dq = [from];
  const ignore = ignoresNebula(g, p);
  while (dq.length) {
    const u = dq.shift()!;
    if (u === to) return dist[u]!;
    if (u !== from && (enemyAt(g, p, u) >= 0 || (kindAt(g, u) === 'nebula' && !ignore))) continue;
    for (const v of ADJ[u]!) {
      const k = kindAt(g, v);
      if (k === 'field') continue;
      const w = k === 'rift' ? 0 : 1;
      if (dist[u]! + w < dist[v]!) {
        dist[v] = dist[u]! + w;
        if (w === 0) dq.unshift(v);
        else dq.push(v);
      }
    }
  }
  return dist[to]!;
}

// ---------------------------------------------------------------------------------------------
// Paying

const resValue = (g: Star, p: number, pl: PlanetState) => {
  const r = PLANETS[pl.id]!.r;
  return r > 0 && has(g, p, 'drills') ? r + 1 : r;
};
const infValue = (pl: PlanetState) => PLANETS[pl.id]!.i;
export function spendable(g: Star, p: number, what: 'res' | 'inf') {
  return owned(g, p)
    .filter((pl) => pl.ready)
    .reduce((s, pl) => s + (what === 'res' ? resValue(g, p, pl) : infValue(pl)), 0);
}

/** Exhausts planets (and trade goods) worth `need`; wastes as little as possible. Mutates g. */
function payOne(g: Star, p: number, need: number, what: 'res' | 'inf') {
  if (need <= 0) return true;
  const me = g.ps[p]!;
  const ready = owned(g, p).filter(
    (pl) => pl.ready && (what === 'res' ? resValue(g, p, pl) : infValue(pl)) > 0,
  );
  const vals = ready.map((pl) => (what === 'res' ? resValue(g, p, pl) : infValue(pl)));
  const total = vals.reduce((a, b) => a + b, 0);
  // reach[s] = planets (indices into ready) summing exactly to s.
  const reach: (number[] | null)[] = new Array<number[] | null>(total + 1).fill(null);
  reach[0] = [];
  vals.forEach((v, k) => {
    for (let s = total - v; s >= 0; s--)
      if (reach[s] && !reach[s + v]) reach[s + v] = [...reach[s]!, k];
  });
  let best = -1;
  let bestCost = Infinity;
  for (let s = 0; s <= total; s++) {
    if (!reach[s]) continue;
    const tg = Math.max(0, need - s);
    if (tg > me.tg) continue;
    const cost = Math.max(0, s - need) + tg * 0.6;
    if (cost < bestCost - 1e-9) {
      bestCost = cost;
      best = s;
    }
  }
  if (best < 0) return false;
  for (const k of reach[best]!) ready[k]!.ready = false;
  me.tg -= Math.max(0, need - best);
  return true;
}
export interface Cost {
  res?: number;
  inf?: number;
  tg?: number;
}
/** Pays resources first, then influence, then plain trade goods. Mutates g; false if it cannot. */
function pay(g: Star, p: number, c: Cost) {
  if ((c.tg ?? 0) > g.ps[p]!.tg) return false;
  g.ps[p]!.tg -= c.tg ?? 0;
  return payOne(g, p, c.res ?? 0, 'res') && payOne(g, p, c.inf ?? 0, 'inf');
}
export function canPay(g: Star, p: number, c: Cost) {
  if (!c.res && !c.inf && !c.tg) return true;
  const total = (c.res ?? 0) + (c.inf ?? 0) + (c.tg ?? 0);
  if (spendable(g, p, 'res') + spendable(g, p, 'inf') + g.ps[p]!.tg < total) return false;
  return pay(structuredClone(g), p, c);
}

// ---------------------------------------------------------------------------------------------
// Set-up

/** Deals the galaxy: Nexus in the middle, homes on the outer corners, the pool shuffled around. */
export function dealGalaxy(players: number, factions: number[], rng: Rng): string[] {
  const homes = HOME_CORNERS[players]!.map((c) => CORNERS[c]!);
  for (let tries = 0; ; tries++) {
    const tiles = new Array<string>(POS.length).fill('');
    tiles[NEXUS] = 'nexus';
    homes.forEach((h, p) => (tiles[h] = `h-${FACTIONS[factions[p]!]!.id}`));
    const pool = rng.shuffle(POOL);
    let k = 0;
    for (let s = 0; s < POS.length; s++) if (!tiles[s]) tiles[s] = pool[k++]!.id;
    const kind = (s: number) => TILE_AT.get(tiles[s]!)!.kind;
    const anomaly = (s: number) => ['nebula', 'rift', 'field'].includes(kind(s));
    const ok =
      homes.every(
        (h) =>
          ADJ[h]!.every((s) => !anomaly(s)) &&
          ADJ[h]!.filter((s) => kind(s) === 'planets').length >= 2,
      ) &&
      tiles.every((_, s) => kind(s) !== 'field' || ADJ[s]!.every((t) => kind(t) !== 'field')) &&
      homes.every((h) => {
        const seen = new Set([h]);
        const todo = [h];
        while (todo.length) {
          const u = todo.pop()!;
          for (const v of ADJ[u]!)
            if (!seen.has(v) && kind(v) !== 'field') {
              seen.add(v);
              todo.push(v);
            }
        }
        return seen.has(NEXUS) && homes.every((o) => seen.has(o));
      });
    if (ok || tries > 500) return tiles;
  }
}

export function newStar(players: number, seed: number, target = 10, faction0?: number): Star {
  const rng = new Rng(seed >>> 0);
  const rest = rng.shuffle(FACTIONS.map((_, i) => i).filter((i) => i !== faction0));
  const factions = (faction0 !== undefined ? [faction0, ...rest] : rest).slice(0, players);
  const tiles = dealGalaxy(players, factions, rng);
  const planets: PlanetState[] = [];
  tiles.forEach((id, sys) =>
    TILE_AT.get(id)!.planets.forEach((pid) =>
      planets.push({ id: pid, sys, owner: -1, inf: 0, ready: true, dock: false }),
    ),
  );
  const g: Star = {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    target,
    round: 1,
    maxRounds: MAX_ROUNDS,
    speaker: 0,
    phase: 'strategy',
    ps: factions.map((f) => ({
      faction: f,
      vp: 0,
      tokens: START_TOKENS,
      tg: FACTIONS[f]!.id === 'oru' ? 3 : 0,
      techs: FACTIONS[f]!.id === 'vey' ? ['ion'] : [],
      cards: [],
      played: [],
      passed: false,
      scored: [],
    })),
    tiles,
    space: POS.map(() => factions.map(() => emptyFleet())),
    planets,
    tokens: POS.map(() => factions.map(() => false)),
    revealed: [],
    deck1: [],
    deck2: [],
    agendas: [],
    laws: [],
    nexusTaken: false,
    cardTg: CARDS.map(() => 0),
    queue: [],
    order: [],
    turn: 0,
    act: null,
    battle: null,
    follow: null,
    council: null,
    winners: [],
    log: [{ k: 'round', r: 1 }],
  };
  for (let p = 0; p < players; p++) {
    const home = homeOf(g, p);
    const hp = planetsIn(g, home);
    hp.forEach((pl) => (pl.owner = p));
    hp[0]!.dock = true;
    hp[0]!.inf = START_UNITS.infantry + (FACTIONS[factions[p]!]!.id === 'tal' ? 2 : 0);
    const f = g.space[home]![p]!;
    for (const k of SHIPS) f[k] = START_UNITS[k];
  }
  const nx = planet(g, NEXUS_PLANET)!;
  nx.owner = -2;
  nx.inf = WARDENS;
  const r2 = new Rng(g.rng);
  g.deck1 = r2.shuffle(OBJECTIVES.map((o, i) => (o.stage === 1 ? i : -1)).filter((i) => i >= 0));
  g.deck2 = r2.shuffle(OBJECTIVES.map((o, i) => (o.stage === 2 ? i : -1)).filter((i) => i >= 0));
  g.revealed = [g.deck1.shift()!, g.deck1.shift()!];
  g.agendas = r2.shuffle(AGENDAS.map((_, i) => i));
  g.speaker = r2.int(players);
  g.rng = r2.state;
  g.queue = pickQueue(g);
  return g;
}

function pickQueue(g: Star) {
  const seats = Array.from({ length: g.players }, (_, k) => (g.speaker + k) % g.players);
  return g.players === 2 ? [...seats, ...seats] : seats;
}

// ---------------------------------------------------------------------------------------------
// Queries used by rules, objectives, AI and table

export function currentPlayer(g: Star) {
  switch (g.phase) {
    case 'strategy':
    case 'status':
      return g.queue[0] ?? -1;
    case 'follow':
      return g.follow!.queue[0]!;
    case 'council':
      return g.council!.queue[0]!;
    case 'action':
      return g.turn;
    case 'over':
      return -1;
  }
}
/** Systems where p has ships. */
export const shipSystems = (g: Star, p: number) =>
  POS.map((_, s) => s).filter((s) => combatShips(g.space[s]![p]!) > 0);
export const onBoard = (g: Star, p: number, k: Kind) =>
  g.space.reduce((n, row) => n + row[p]![k], 0) +
  (k === 'infantry' ? owned(g, p).reduce((n, pl) => n + pl.inf, 0) : 0);
export const docksOf = (g: Star, p: number) => owned(g, p).filter((pl) => pl.dock).length;
/** Production capacity of p's docks in system s. */
export function productionAt(g: Star, p: number, s: number) {
  return planetsIn(g, s)
    .filter((pl) => pl.owner === p && pl.dock)
    .reduce(
      (n, pl) =>
        n +
        PLANETS[pl.id]!.r +
        2 +
        (has(g, p, 'logistics') ? 2 : 0) +
        (law(g, 'shipwright') ? 1 : 0),
      0,
    );
}
export const homePlayer = (g: Star, s: number) => {
  for (let p = 0; p < g.players; p++) if (homeOf(g, p) === s) return p;
  return -1;
};
export function meets(g: Star, p: number, obj: number) {
  const o = OBJECTIVES[obj]!;
  const mine = owned(g, p);
  const sum = (f: (id: number) => number) => mine.reduce((n, pl) => n + f(pl.id), 0);
  switch (o.id) {
    case 'planets6':
      return mine.length >= 6;
    case 'planets10':
      return mine.length >= 10;
    case 'res9':
      return sum((id) => PLANETS[id]!.r) >= 9;
    case 'inf9':
      return sum((id) => PLANETS[id]!.i) >= 9;
    case 'tech2':
      return g.ps[p]!.techs.length >= 2;
    case 'tech5':
      return g.ps[p]!.techs.length >= 5;
    case 'ships4':
      return shipSystems(g, p).length >= 4;
    case 'ships6':
      return shipSystems(g, p).length >= 6;
    case 'docks2':
      return docksOf(g, p) >= 2;
    case 'nexus':
      return planet(g, NEXUS_PLANET)!.owner === p;
    case 'dreads3':
      return onBoard(g, p, 'dread') >= 3;
    case 'frontier':
      return mine.some((pl) =>
        ADJ[pl.sys]!.some((s) => {
          const h = homePlayer(g, s);
          return h >= 0 && h !== p;
        }),
      );
    case 'strike':
      return mine.some((pl) => {
        const h = homePlayer(g, pl.sys);
        return h >= 0 && h !== p;
      });
    default:
      return canPay(g, p, o.spend!);
  }
}
export const canScore = (g: Star, p: number, obj: number, extra: Cost = {}) =>
  g.revealed.includes(obj) &&
  !g.ps[p]!.scored.includes(obj) &&
  meets(g, p, obj) &&
  canPay(g, p, addCost(OBJECTIVES[obj]!.spend ?? {}, extra));
const addCost = (a: Cost, b: Cost): Cost => ({
  res: (a.res ?? 0) + (b.res ?? 0),
  inf: (a.inf ?? 0) + (b.inf ?? 0),
  tg: (a.tg ?? 0) + (b.tg ?? 0),
});
export function canResearch(g: Star, p: number, t: TechId) {
  const me = g.ps[p]!;
  if (me.techs.includes(t)) return false;
  return TECHS.find((x) => x.id === t)!.tier === 1 || me.techs.length >= 2;
}
/** Planets where p may put a dock: its own, in a system with no dock of its. */
export function dockSpots(g: Star, p: number) {
  if (docksOf(g, p) >= DOCKS) return [];
  return owned(g, p).filter(
    (pl) => !planetsIn(g, pl.sys).some((o) => o.owner === p && o.dock) && enemyAt(g, p, pl.sys) < 0,
  );
}
export const researchCost = (g: Star, p: number) => (fid(g, p) === 'vey' ? 2 : 4);
export const votesOf = (g: Star, p: number) =>
  owned(g, p)
    .filter((pl) => pl.ready)
    .reduce((n, pl) => n + infValue(pl), 0) +
  (fid(g, p) === 'lumen' ? 3 : 0) +
  (has(g, p, 'envoy') ? owned(g, p).length : 0);

/** Where p's ships in s would retreat to (adjacent, no enemy ships, own units or planets), or −1. */
export function retreatTo(g: Star, p: number, s: number) {
  let best = -1;
  let bestScore = -1;
  for (const t of ADJ[s]!) {
    if (kindAt(g, t) === 'field' || enemyAt(g, p, t) >= 0) continue;
    const mine = planetsIn(g, t).filter((pl) => pl.owner === p).length * 2;
    const ships = combatShips(g.space[t]![p]!);
    if (mine + ships === 0) continue;
    if (mine + ships > bestScore) {
      bestScore = mine + ships;
      best = t;
    }
  }
  return best;
}

/** What a unit of kind k may still move into the active system from `from` (0 if none). */
function movable(g: Star, p: number, from: number, k: Kind) {
  const a = g.act!;
  const s = a.sys;
  if (from === s || g.tokens[from]![p]) return 0;
  const src = g.space[from]![p]!;
  const dst = g.space[s]![p]!;
  if (k === 'fighter' || k === 'infantry') {
    if (!a.from.includes(from)) return 0;
    const free = capacityOf(g, p, dst) - dst.fighter - dst.infantry;
    const avail =
      k === 'fighter'
        ? src.fighter
        : src.infantry +
          planetsIn(g, from)
            .filter((pl) => pl.owner === p)
            .reduce((n, pl) => n + pl.inf, 0);
    return Math.max(0, Math.min(avail, free));
  }
  if (src[k] === 0) return 0;
  if (distance(g, p, from, s) > moveOf(g, p, k)) return 0;
  return Math.max(0, Math.min(src[k], fleetLimit(g, p) - bigShips(dst)));
}

// ---------------------------------------------------------------------------------------------
// Legal actions

export function legalActions(g: Star): Action[] {
  const p = currentPlayer(g);
  const out: Action[] = [];
  if (p < 0) return out;
  const me = g.ps[p]!;
  switch (g.phase) {
    case 'strategy':
      CARDS.forEach((_, c) => {
        if (!g.ps.some((x) => x.cards.includes(c))) out.push({ t: 'pick', card: c });
      });
      return out;
    case 'status':
      for (const obj of g.revealed) if (canScore(g, p, obj)) out.push({ t: 'score', obj });
      out.push({ t: 'skip' });
      return out;
    case 'council': {
      const a = AGENDAS[g.council!.agenda]!;
      const options = a.elect ? g.players : 2;
      for (let o = 0; o < options; o++) out.push({ t: 'vote', option: o });
      out.push({ t: 'abstain' });
      return out;
    }
    case 'follow': {
      const f = g.follow!;
      for (const x of followChoices(g, p, f.card)) out.push({ t: 'follow', x });
      out.push({ t: 'decline' });
      return out;
    }
    case 'over':
      return out;
    case 'action':
      break;
  }
  const a = g.act;
  if (!a) {
    if (me.tokens > 0)
      POS.forEach((_, s) => {
        if (!g.tokens[s]![p] && kindAt(g, s) !== 'field') out.push({ t: 'activate', sys: s });
      });
    for (const c of me.cards)
      if (!me.played.includes(c))
        for (const x of primaryChoices(g, p, c)) out.push({ t: 'play', card: c, x });
    if (me.cards.every((c) => me.played.includes(c))) out.push({ t: 'pass' });
    return out;
  }
  const s = a.sys;
  switch (a.step) {
    case 'move':
      POS.forEach((_, from) => {
        for (const k of KINDS) {
          const m = movable(g, p, from, k);
          for (let n = 1; n <= m; n++) out.push({ t: 'move', from, kind: k, n });
        }
      });
      out.push({ t: 'done' });
      return out;
    case 'space':
      out.push({ t: 'roll' });
      if (g.battle!.round > 0 && retreatTo(g, p, s) >= 0) out.push({ t: 'retreat' });
      return out;
    case 'land': {
      const inf = g.space[s]![p]!.infantry;
      for (const pl of planetsIn(g, s))
        for (let n = 1; n <= inf; n++) out.push({ t: 'land', planet: pl.id, n });
      out.push({ t: 'done' });
      return out;
    }
    case 'build': {
      for (const k of KINDS) {
        if (canQueue(g, p, k)) out.push({ t: 'build', kind: k });
        if (a.queue.includes(k)) out.push({ t: 'unbuild', kind: k });
      }
      out.push({ t: 'done' });
      return out;
    }
  }
}

export const queueCost = (q: Kind[]) => q.reduce((n, k) => n + UNITS[k].cost, 0);
export function canQueue(g: Star, p: number, k: Kind) {
  const a = g.act!;
  const s = a.sys;
  const q = [...a.queue, k];
  if (q.length > productionAt(g, p, s)) return false;
  if (!canPay(g, p, { res: queueCost(q) })) return false;
  if (onBoard(g, p, k) + q.filter((x) => x === k).length > UNITS[k].supply) return false;
  const f = { ...g.space[s]![p]! };
  for (const x of q) if (x !== 'infantry') f[x]++;
  if (bigShips(f) > fleetLimit(g, p)) return false;
  return f.fighter + f.infantry <= capacityOf(g, p, f);
}

function primaryChoices(g: Star, p: number, c: number): number[] {
  switch (CARDS[c]!) {
    case 'industry': {
      const spots = dockSpots(g, p).map((pl) => pl.id);
      return spots.length ? spots : [-1];
    }
    case 'research': {
      const ts = TECH_IDS.map((t, i) => (canResearch(g, p, t) ? i : -1)).filter((i) => i >= 0);
      return ts.length ? ts : [-1];
    }
    case 'dominion':
      return [...g.revealed.filter((o) => canScore(g, p, o)), -1];
    default:
      return [-1];
  }
}
function followChoices(g: Star, p: number, c: number): number[] {
  const me = g.ps[p]!;
  const id = CARDS[c]!;
  if (id === 'command') return canPay(g, p, { inf: 3 }) ? [-1] : [];
  if (me.tokens < 1) return [];
  switch (id) {
    case 'accord':
      return owned(g, p).some((pl) => !pl.ready) ? [-1] : [];
    case 'commerce':
      return [-1];
    case 'industry':
      return canPay(g, p, { res: 4 }) ? dockSpots(g, p).map((pl) => pl.id) : [];
    case 'research':
      return canPay(g, p, { res: researchCost(g, p) })
        ? TECH_IDS.map((t, i) => (canResearch(g, p, t) ? i : -1)).filter((i) => i >= 0)
        : [];
    case 'dominion':
      return g.revealed.filter((o) => canScore(g, p, o, { inf: 3 }));
  }
  return [];
}

const same = (a: Action, b: Action) => JSON.stringify(a) === JSON.stringify(b);
export const isLegal = (g: Star, a: Action) => legalActions(g).some((b) => same(a, b));

// ---------------------------------------------------------------------------------------------
// Applying actions

export function act(state: Star, a: Action): Star {
  if (!isLegal(state, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g = structuredClone(state);
  const p = currentPlayer(g);
  const me = g.ps[p]!;
  switch (a.t) {
    case 'pick': {
      me.cards.push(a.card);
      me.tg += g.cardTg[a.card]!;
      g.log.push({ k: 'pick', p, card: a.card, tg: g.cardTg[a.card]! });
      g.cardTg[a.card] = 0;
      g.queue.shift();
      if (!g.queue.length) startActions(g);
      break;
    }
    case 'activate': {
      me.tokens--;
      g.tokens[a.sys]![p] = true;
      g.act = { sys: a.sys, step: 'move', from: [], bombarded: false, queue: [] };
      g.log.push({ k: 'activate', p, sys: a.sys });
      break;
    }
    case 'move':
      doMove(g, p, a.from, a.kind, a.n);
      break;
    case 'done': {
      const step = g.act!.step;
      if (step === 'move') afterMove(g, p);
      else if (step === 'land') toBuild(g, p);
      else if (step === 'build') {
        const q = g.act!.queue;
        if (q.length) {
          const cost = queueCost(q);
          pay(g, p, { res: cost });
          const s = g.act!.sys;
          const dockPl = planetsIn(g, s).find((pl) => pl.owner === p && pl.dock)!;
          for (const k of q) {
            if (k === 'infantry') dockPl.inf++;
            else g.space[s]![p]![k]++;
          }
          g.log.push({ k: 'build', p, sys: s, n: q.length, cost });
        }
        endAction(g);
      }
      break;
    }
    case 'roll':
      fightRound(g, p);
      break;
    case 'retreat': {
      const s = g.act!.sys;
      const to = retreatTo(g, p, s);
      const f = g.space[s]![p]!;
      const t = g.space[to]![p]!;
      for (const k of KINDS) {
        t[k] += f[k];
        f[k] = 0;
      }
      t.damaged += f.damaged;
      f.damaged = 0;
      trimCapacity(g, p, to);
      g.log.push({ k: 'retreat', p, sys: s, to });
      g.battle = null;
      endAction(g);
      break;
    }
    case 'land':
      doLand(g, p, a.planet, a.n);
      break;
    case 'build':
      g.act!.queue.push(a.kind);
      break;
    case 'unbuild': {
      const q = g.act!.queue;
      q.splice(q.lastIndexOf(a.kind), 1);
      break;
    }
    case 'play':
      playPrimary(g, p, a.card, a.x);
      break;
    case 'follow':
    case 'decline': {
      const f = g.follow!;
      if (a.t === 'follow') {
        doSecondary(g, p, f.card, a.x);
        g.log.push({ k: 'follow', p, card: f.card, x: a.x });
      }
      f.queue.shift();
      if (g.phase !== 'over' && !f.queue.length) {
        g.follow = null;
        g.phase = 'action';
        endAction(g);
      }
      break;
    }
    case 'pass':
      me.passed = true;
      g.log.push({ k: 'pass', p });
      endAction(g);
      break;
    case 'score':
    case 'skip':
      if (a.t === 'score') score(g, p, a.obj, {});
      g.queue.shift();
      if (g.phase !== 'over' && !g.queue.length) finishStatus(g);
      break;
    case 'vote':
    case 'abstain': {
      const c = g.council!;
      if (a.t === 'vote') {
        const n = votesOf(g, p);
        owned(g, p).forEach((pl) => {
          if (infValue(pl) > 0) pl.ready = false;
        });
        c.votes.push({ p, option: a.option, n });
      }
      c.queue.shift();
      if (!c.queue.length) resolveAgenda(g);
      break;
    }
  }
  return g;
}

function startActions(g: Star) {
  // Cards nobody took gain a trade good.
  CARDS.forEach((_, c) => {
    if (!g.ps.some((x) => x.cards.includes(c))) g.cardTg[c]!++;
  });
  g.order = g.ps
    .map((x, p) => ({ p, init: Math.min(...x.cards) }))
    .sort((a, b) => a.init - b.init)
    .map((x) => x.p);
  g.turn = g.order[0]!;
  g.phase = 'action';
}

function endAction(g: Star) {
  g.act = null;
  g.battle = null;
  if (g.phase === 'over') return;
  const i = g.order.indexOf(g.turn);
  for (let k = 1; k <= g.order.length; k++) {
    const q = g.order[(i + k) % g.order.length]!;
    if (!g.ps[q]!.passed) {
      g.turn = q;
      return;
    }
  }
  startStatus(g);
}

function doMove(g: Star, p: number, from: number, k: Kind, n: number) {
  const a = g.act!;
  const s = a.sys;
  const src = g.space[from]![p]!;
  const dst = g.space[s]![p]!;
  if (k === 'infantry') {
    let left = n;
    const take = Math.min(src.infantry, left);
    src.infantry -= take;
    left -= take;
    const pls = planetsIn(g, from)
      .filter((pl) => pl.owner === p)
      .sort((x, y) => y.inf - x.inf);
    for (const pl of pls) {
      const t = Math.min(pl.inf, left);
      pl.inf -= t;
      left -= t;
    }
    dst.infantry += n;
    return;
  }
  if (k === 'dread') {
    const dmg = Math.max(0, n - (src.dread - src.damaged));
    src.damaged -= dmg;
    dst.damaged += dmg;
  }
  src[k] -= n;
  dst[k] += n;
  if (k === 'carrier' || k === 'dread') {
    if (!a.from.includes(from)) a.from.push(from);
    // Fighters and infantry left without room travel along.
    let over = Math.max(0, src.fighter + src.infantry - capacityOf(g, p, src));
    const f = Math.min(over, src.fighter);
    src.fighter -= f;
    dst.fighter += f;
    over -= f;
    if (over > 0) {
      src.infantry -= over;
      dst.infantry += over;
    }
  }
}

function afterMove(g: Star, p: number) {
  const s = g.act!.sys;
  const d = enemyAt(g, p, s);
  if (d >= 0 && combatShips(g.space[s]![p]!) > 0) {
    g.act!.step = 'space';
    g.battle = { defender: d, round: 0, last: null };
  } else toLand(g, p);
}
function toLand(g: Star, p: number) {
  const s = g.act!.sys;
  if (g.space[s]![p]!.infantry > 0 && planetsIn(g, s).length) g.act!.step = 'land';
  else toBuild(g, p);
}
function toBuild(g: Star, p: number) {
  const s = g.act!.sys;
  if (productionAt(g, p, s) > 0 && enemyAt(g, p, s) < 0) g.act!.step = 'build';
  else endAction(g);
}

function rollAll(rng: Rng, th: number[]) {
  const dice = th.map(() => rng.range(1, 10));
  return { dice, hits: dice.filter((v, i) => v >= th[i]!).length };
}
function spaceThresholds(g: Star, p: number, f: Fleet, round: number) {
  const out: number[] = [];
  const hesh = fid(g, p) === 'hesh' && round === 1 ? 1 : 0;
  for (const k of SHIPS) for (let i = 0; i < f[k]; i++) out.push(hitOn(g, p, k, 'space') - hesh);
  return out;
}
/** Takes hits: an unhurt dreadnought soaks one each, then fighters, cruisers, carriers, dreadnoughts. */
export function takeHits(f: Fleet, hits: number) {
  while (hits > 0 && f.dread - f.damaged > 0) {
    f.damaged++;
    hits--;
  }
  for (const k of ['fighter', 'cruiser', 'carrier', 'dread'] as const)
    while (hits > 0 && f[k] > 0) {
      f[k]--;
      if (k === 'dread') f.damaged = Math.max(0, f.damaged - 1);
      hits--;
    }
}
function trimCapacity(g: Star, p: number, s: number) {
  const f = g.space[s]![p]!;
  let over = f.fighter + f.infantry - capacityOf(g, p, f);
  if (over <= 0) return;
  const k = Math.min(over, f.fighter);
  f.fighter -= k;
  over -= k;
  f.infantry = Math.max(0, f.infantry - over);
}

function fightRound(g: Star, p: number) {
  const s = g.act!.sys;
  const b = g.battle!;
  const d = b.defender;
  b.round++;
  const rng = new Rng(g.rng);
  const A = g.space[s]![p]!;
  const D = g.space[s]![d]!;
  const ra = rollAll(rng, spaceThresholds(g, p, A, b.round));
  const rd = rollAll(rng, spaceThresholds(g, d, D, b.round));
  g.rng = rng.state;
  takeHits(D, ra.hits);
  takeHits(A, rd.hits);
  b.last = { a: ra.dice, d: rd.dice, ah: ra.hits, dh: rd.hits };
  const aAlive = combatShips(A) > 0;
  const dAlive = combatShips(D) > 0;
  if (aAlive && dAlive) return;
  trimCapacity(g, p, s);
  trimCapacity(g, d, s);
  if (!aAlive) A.infantry = 0;
  if (!dAlive) D.infantry = 0;
  g.log.push({ k: 'battle', p, d, sys: s, won: aAlive ? true : dAlive ? false : null });
  g.battle = { ...b };
  if (aAlive) {
    g.battle = null;
    toLand(g, p);
  } else endAction(g);
}

function doLand(g: Star, p: number, id: number, n: number) {
  const s = g.act!.sys;
  const f = g.space[s]![p]!;
  const pl = planet(g, id)!;
  f.infantry -= n;
  if (pl.owner === p) {
    pl.inf += n;
    return;
  }
  const from = pl.owner;
  const rng = new Rng(g.rng);
  let att = n;
  let def = pl.inf;
  if (def > 0 && !g.act!.bombarded && f.dread > 0) {
    g.act!.bombarded = true;
    def -= rollAll(rng, new Array<number>(f.dread).fill(hitOn(g, p, 'dread', 'bomb'))).hits;
    def = Math.max(0, def);
  }
  while (att > 0 && def > 0) {
    const ha = rollAll(rng, new Array<number>(att).fill(hitOn(g, p, 'infantry', 'attack'))).hits;
    const hd = rollAll(
      rng,
      new Array<number>(def).fill(from === -2 ? 7 : hitOn(g, from, 'infantry', 'defend')),
    ).hits;
    def = Math.max(0, def - ha);
    att = Math.max(0, att - hd);
  }
  g.rng = rng.state;
  if (att > 0) {
    if (from !== -1) g.log.push({ k: 'ground', p, planet: id, from, won: true });
    else g.log.push({ k: 'claim', p, planet: id });
    pl.owner = p;
    pl.inf = att;
    pl.ready = false;
    pl.dock = from === p ? pl.dock : false;
    if (id === NEXUS_PLANET && !g.nexusTaken) {
      g.nexusTaken = true;
      g.log.push({ k: 'seat', p });
      gainVp(g, p, 1);
    }
  } else {
    pl.inf = def;
    g.log.push({ k: 'ground', p, planet: id, from, won: false });
  }
  if (g.phase !== 'over' && f.infantry === 0) toBuild(g, p);
}

function gainVp(g: Star, p: number, n: number) {
  g.ps[p]!.vp = Math.max(0, g.ps[p]!.vp + n);
  if (g.ps[p]!.vp >= g.target && g.phase !== 'over') {
    g.phase = 'over';
    g.winners = [p];
    g.act = null;
    g.battle = null;
    g.follow = null;
    g.council = null;
    g.queue = [];
    g.log.push({ k: 'end', winners: [p] });
  }
}

function score(g: Star, p: number, obj: number, extra: Cost) {
  pay(g, p, addCost(OBJECTIVES[obj]!.spend ?? {}, extra));
  g.ps[p]!.scored.push(obj);
  const vp = STAGE_VP[OBJECTIVES[obj]!.stage];
  g.log.push({ k: 'score', p, obj, vp });
  gainVp(g, p, vp);
}

function readyAll(g: Star, p: number) {
  owned(g, p).forEach((pl) => (pl.ready = true));
}
function dock(g: Star, id: number) {
  planet(g, id)!.dock = true;
}
function research(g: Star, p: number, x: number) {
  if (x >= 0) g.ps[p]!.techs.push(TECH_IDS[x]!);
}
function commerce(g: Star, p: number, n: number) {
  g.ps[p]!.tg += n + (fid(g, p) === 'oru' ? 1 : 0);
}

function playPrimary(g: Star, p: number, c: number, x: number) {
  const me = g.ps[p]!;
  me.played.push(c);
  g.log.push({ k: 'play', p, card: c, x });
  switch (CARDS[c]!) {
    case 'command':
      me.tokens = Math.min(MAX_TOKENS, me.tokens + 2);
      g.speaker = p;
      break;
    case 'accord':
      readyAll(g, p);
      break;
    case 'commerce':
      commerce(g, p, 3);
      break;
    case 'industry':
      if (x >= 0) dock(g, x);
      else me.tg++;
      break;
    case 'research':
      if (x >= 0) research(g, p, x);
      else me.tg++;
      break;
    case 'dominion':
      if (x >= 0) score(g, p, x, {});
      if (g.phase !== 'over' && planet(g, NEXUS_PLANET)!.owner === p) {
        g.log.push({ k: 'throne', p });
        gainVp(g, p, 1);
      }
      break;
  }
  if (g.phase === 'over') return;
  const others = Array.from({ length: g.players - 1 }, (_, k) => (p + 1 + k) % g.players);
  const queue = others.filter((q) => followChoices(g, q, c).length > 0);
  if (!queue.length) {
    endAction(g);
    return;
  }
  g.follow = { card: c, by: p, queue };
  g.phase = 'follow';
}

function doSecondary(g: Star, p: number, c: number, x: number) {
  const me = g.ps[p]!;
  const id = CARDS[c]!;
  if (id === 'command') {
    pay(g, p, { inf: 3 });
    me.tokens = Math.min(MAX_TOKENS, me.tokens + 1);
    return;
  }
  me.tokens--;
  switch (id) {
    case 'accord': {
      owned(g, p)
        .filter((pl) => !pl.ready)
        .sort((a, b) => PLANETS[b.id]!.r + PLANETS[b.id]!.i - PLANETS[a.id]!.r - PLANETS[a.id]!.i)
        .slice(0, 2)
        .forEach((pl) => (pl.ready = true));
      break;
    }
    case 'commerce':
      commerce(g, p, 1);
      break;
    case 'industry':
      pay(g, p, { res: 4 });
      dock(g, x);
      break;
    case 'research':
      pay(g, p, { res: researchCost(g, p) });
      research(g, p, x);
      break;
    case 'dominion':
      score(g, p, x, { inf: 3 });
      break;
  }
}

function startStatus(g: Star) {
  g.phase = 'status';
  g.queue = [...g.order];
}

function finishStatus(g: Star) {
  const nx = planet(g, NEXUS_PLANET)!;
  if (nx.owner >= 0) {
    g.log.push({ k: 'throne', p: nx.owner });
    gainVp(g, nx.owner, 1);
    if (g.phase === 'over') return;
  }
  if (g.round >= g.maxRounds) {
    endByRounds(g);
    return;
  }
  const next = g.round < STAGE1_ROUNDS ? g.deck1.shift() : g.deck2.shift();
  if (next !== undefined) {
    g.revealed.push(next);
    g.log.push({ k: 'reveal', obj: next });
  }
  for (let p = 0; p < g.players; p++) {
    const me = g.ps[p]!;
    me.tokens = Math.min(MAX_TOKENS, me.tokens + STATUS_TOKENS);
    readyAll(g, p);
    me.cards = [];
    me.played = [];
    me.passed = false;
  }
  g.space.forEach((row) => row.forEach((f) => (f.damaged = 0)));
  g.tokens = g.tokens.map((row) => row.map(() => false));
  if (g.nexusTaken && g.agendas.length) {
    g.phase = 'council';
    const queue = Array.from({ length: g.players }, (_, k) => (g.speaker + 1 + k) % g.players);
    g.council = { agenda: g.agendas.shift()!, queue, votes: [] };
  } else newRound(g);
}

function newRound(g: Star) {
  g.round++;
  g.phase = 'strategy';
  g.council = null;
  g.queue = pickQueue(g);
  g.log.push({ k: 'round', r: g.round });
}

function endByRounds(g: Star) {
  const key = (p: number) => g.ps[p]!.vp * 100 + owned(g, p).length;
  const best = Math.max(...g.ps.map((_, p) => key(p)));
  g.winners = g.ps.map((_, p) => p).filter((p) => key(p) === best);
  g.phase = 'over';
  g.queue = [];
  g.log.push({ k: 'end', winners: g.winners });
}

/** The option the council chose (−1: nothing passes), from the votes cast. */
export function tally(g: Star, c: Council) {
  const a = AGENDAS[c.agenda]!;
  const n = a.elect ? g.players : 2;
  const sums = Array.from({ length: n }, (_, o) =>
    c.votes.filter((v) => v.option === o).reduce((s, v) => s + v.n, 0),
  );
  const best = Math.max(...sums);
  if (best <= 0) return { option: -1, sums };
  const tied = sums.map((v, o) => (v === best ? o : -1)).filter((o) => o >= 0);
  const sp = c.votes.find((v) => v.p === g.speaker);
  const option = sp && tied.includes(sp.option) ? sp.option : tied[0]!;
  return { option, sums };
}

function resolveAgenda(g: Star) {
  const c = g.council!;
  const { option, sums } = tally(g, c);
  const id = AGENDAS[c.agenda]!.id;
  g.log.push({ k: 'agenda', agenda: c.agenda, option, votes: option >= 0 ? sums[option]! : 0 });
  const all = Array.from({ length: g.players }, (_, p) => p);
  const homeSpace = (p: number) => g.space[homeOf(g, p)]![p]!;
  const homeFree = (p: number) => enemyAt(g, p, homeOf(g, p)) < 0;
  if (option >= 0)
    switch (id) {
      case 'lanes':
      case 'shipwright':
        if (option === 0) g.laws.push(c.agenda);
        break;
      case 'laureate':
        gainVp(g, option, 1);
        break;
      case 'tribute':
        g.ps[option]!.tg += 4;
        break;
      case 'censure':
        gainVp(g, option, -1);
        break;
      case 'mandate':
        g.ps[option]!.tokens = Math.min(MAX_TOKENS, g.ps[option]!.tokens + 2);
        break;
      case 'charter':
        g.speaker = option;
        g.ps[option]!.tg++;
        break;
      case 'fleet':
        for (const p of all)
          if (option === 1) g.ps[p]!.tg++;
          else if (
            homeFree(p) &&
            onBoard(g, p, 'cruiser') < UNITS.cruiser.supply &&
            bigShips(homeSpace(p)) < fleetLimit(g, p)
          )
            homeSpace(p).cruiser++;
        break;
      case 'mining':
        for (const p of all)
          g.ps[p]!.tg += owned(g, p).filter((pl) =>
            option === 0 ? PLANETS[pl.id]!.r >= 3 : PLANETS[pl.id]!.i >= 3,
          ).length;
        break;
      case 'disarm':
        for (const p of all)
          if (option === 1) g.ps[p]!.tokens = Math.min(MAX_TOKENS, g.ps[p]!.tokens + 1);
          else if (onBoard(g, p, 'dread') >= 2) {
            const s = POS.map((_, k) => k).sort(
              (x, y) => g.space[y]![p]!.dread - g.space[x]![p]!.dread,
            )[0]!;
            const f = g.space[s]![p]!;
            f.dread--;
            f.damaged = Math.min(f.damaged, f.dread);
            trimCapacity(g, p, s);
          }
        break;
      case 'archives':
        if (option === 0) {
          const fewest = Math.min(...g.ps.map((x) => x.techs.length));
          for (const p of all)
            if (g.ps[p]!.techs.length === fewest) {
              const t = TECH_IDS.findIndex((x) => canResearch(g, p, x));
              if (t >= 0) research(g, p, t);
            }
        }
        break;
      case 'watch':
        for (const p of all) {
          if (option === 0) {
            const pl = planetsIn(g, homeOf(g, p)).find((x) => x.owner === p);
            if (pl && onBoard(g, p, 'infantry') < UNITS.infantry.supply) pl.inf++;
          } else {
            const f = homeSpace(p);
            if (
              homeFree(p) &&
              onBoard(g, p, 'fighter') < UNITS.fighter.supply &&
              f.fighter + f.infantry < capacityOf(g, p, f)
            )
              f.fighter++;
          }
        }
        break;
    }
  if (g.phase === 'over') return;
  newRound(g);
}

// ---------------------------------------------------------------------------------------------
// Validation (saves, environment)

const isFleet = (f: unknown): f is Fleet => {
  if (typeof f !== 'object' || f === null) return false;
  const x = f as Fleet;
  return (
    [...KINDS, 'damaged' as const].every((k) => Number.isInteger(x[k]) && x[k] >= 0) &&
    x.damaged <= x.dread
  );
};
export function isValidStar(d: unknown): d is Star {
  if (typeof d !== 'object' || d === null) return false;
  const g = d as Star;
  if (![2, 3, 4].includes(g.players)) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  if (!['strategy', 'action', 'follow', 'status', 'council', 'over'].includes(g.phase))
    return false;
  if (!Array.isArray(g.ps) || g.ps.length !== g.players) return false;
  if (
    !g.ps.every(
      (x) =>
        Number.isInteger(x.faction) &&
        x.faction >= 0 &&
        x.faction < FACTIONS.length &&
        Number.isInteger(x.vp) &&
        Number.isInteger(x.tokens) &&
        Number.isInteger(x.tg) &&
        Array.isArray(x.techs) &&
        x.techs.every((t) => TECH_IDS.includes(t)) &&
        Array.isArray(x.cards) &&
        Array.isArray(x.played) &&
        Array.isArray(x.scored),
    )
  )
    return false;
  if (!Array.isArray(g.tiles) || g.tiles.length !== POS.length) return false;
  if (!g.tiles.every((t) => TILE_AT.has(t))) return false;
  if (!Array.isArray(g.space) || g.space.length !== POS.length) return false;
  if (!g.space.every((row) => Array.isArray(row) && row.length === g.players && row.every(isFleet)))
    return false;
  if (!Array.isArray(g.tokens) || g.tokens.length !== POS.length) return false;
  if (!Array.isArray(g.planets)) return false;
  const expected = g.tiles.flatMap((t) => TILE_AT.get(t)!.planets);
  if (g.planets.length !== expected.length) return false;
  if (
    !g.planets.every(
      (pl, k) =>
        pl.id === expected[k] &&
        Number.isInteger(pl.owner) &&
        pl.owner >= -2 &&
        pl.owner < g.players &&
        Number.isInteger(pl.inf) &&
        pl.inf >= 0 &&
        g.tiles[pl.sys] !== undefined &&
        TILE_AT.get(g.tiles[pl.sys]!)!.planets.includes(pl.id),
    )
  )
    return false;
  const inRange = (xs: unknown, n: number) =>
    Array.isArray(xs) && xs.every((x) => Number.isInteger(x) && x >= 0 && x < n);
  if (!inRange(g.revealed, OBJECTIVES.length) || !inRange(g.deck1, OBJECTIVES.length)) return false;
  if (!inRange(g.deck2, OBJECTIVES.length) || !inRange(g.agendas, AGENDAS.length)) return false;
  if (!inRange(g.laws, AGENDAS.length) || !Array.isArray(g.cardTg)) return false;
  if (g.act !== null && (typeof g.act !== 'object' || !Number.isInteger(g.act.sys))) return false;
  if ((g.phase === 'follow') !== (g.follow !== null)) return false;
  if ((g.phase === 'council') !== (g.council !== null)) return false;
  return Array.isArray(g.log) && Array.isArray(g.order) && Array.isArray(g.queue);
}

/** Space-battle odds for the AI: p's fleet `a` attacking fleet `d` of player `q` (Monte Carlo). */
export function spaceOdds(
  g: Star,
  p: number,
  a: Fleet,
  q: number,
  d: Fleet,
  runs: number,
  rng: Rng,
) {
  let wins = 0;
  for (let k = 0; k < runs; k++) {
    const A = { ...a };
    const D = { ...d };
    for (let round = 1; round < 30 && combatShips(A) > 0 && combatShips(D) > 0; round++) {
      const ha = rollAll(rng, spaceThresholds(g, p, A, round)).hits;
      const hd = rollAll(rng, spaceThresholds(g, q, D, round)).hits;
      takeHits(D, ha);
      takeHits(A, hd);
    }
    if (combatShips(A) > 0 && combatShips(D) === 0) wins++;
  }
  return wins / runs;
}
