/**
 * Iron Fields rules (pure): an engine-building and area-control game for 2–4 players. On each
 * turn a player picks a section of their board other than last turn's, takes its top action
 * (move, trade, produce, bolster) and may then pay for its bottom action (upgrade, deploy, build,
 * enlist). Workers produce on the land, mechs unlock abilities, the character meets encounters
 * and claims the Foundry, fights are settled by power bids made in secret, and achievements earn
 * stars. When someone places a sixth star the game ends and everyone counts coins: their own plus
 * stars, territories and resources at the rate their popularity allows. Only the land deal and
 * the encounter deck come from chance, through the seeded generator stored in the state.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  ADJ,
  BOARDS,
  BOTTOM,
  BOTTOMS,
  COMBAT_STARS,
  CORNERS,
  ENCOUNTER_SPOTS,
  ENCOUNTERS,
  FACTIONS,
  FOUNDRY,
  FOUNDRY_BONUS,
  FOUNDRY_WORTH,
  HOME_CORNERS,
  MAX_BID,
  MAX_POPULARITY,
  MAX_POWER,
  MAX_TURNS,
  MAX_UPGRADES,
  MAX_WORKERS,
  MECHS,
  POS,
  PRODUCES,
  RECRUITS,
  RES,
  STARS_TO_END,
  STAR_AT,
  START_WORKERS,
  STRUCTURES,
  TERRAIN_POOL,
  TIERS,
  TOPS,
  TOP_STEPS,
  type Bottom,
  type Recruit,
  type Res,
  type Reward,
  type StarId,
  type Structure,
  type Terrain,
  type Top,
} from './world';

export type UnitKind = 'char' | 'worker' | 'mech';
export interface Unit {
  id: number;
  kind: UnitKind;
  owner: number;
  at: number;
}
export interface Player {
  faction: number;
  board: number;
  coins: number;
  power: number;
  popularity: number;
  res: Record<Res, number>;
  /** Top actions improved by upgrades (a top may appear up to its step count). */
  improved: Top[];
  costs: Record<Bottom, number>;
  mechs: number;
  structures: Structure[];
  recruits: Recruit[];
  stars: StarId[];
  last: number;
  foundry: boolean;
  turns: number;
}
export interface Turn {
  section: number;
  top: Top;
  /** Units already moved this turn. */
  moved: number[];
  /** Spaces already produced on. */
  produced: number[];
  /** Move steps left for the unit chosen to move (stride lets it go 2). */
  step: 'top' | 'bottom';
}
export interface Battle {
  hex: number;
  attacker: number;
  defender: number;
  attackBid: number | null;
}
export type Phase = 'choose' | 'turn' | 'attack' | 'defend' | 'encounter' | 'over';
export interface Score {
  coins: number;
  stars: number;
  territories: number;
  resources: number;
  total: number;
}
export type LogEntry =
  | { k: 'section'; p: number; top: Top }
  | { k: 'move'; p: number; unit: UnitKind; to: number }
  | { k: 'coin'; p: number }
  | { k: 'trade'; p: number; got: string }
  | { k: 'produce'; p: number; hex: number; what: string; n: number }
  | { k: 'bolster'; p: number; power: number }
  | { k: 'upgrade'; p: number; top: Top; bottom: Bottom }
  | { k: 'deploy'; p: number; hex: number }
  | { k: 'build'; p: number; hex: number; kind: Structure }
  | { k: 'enlist'; p: number; recruit: Recruit }
  | { k: 'battle'; p: number; d: number; hex: number; a: number; dv: number; won: boolean }
  | { k: 'scatter'; p: number; d: number; hex: number; n: number }
  | { k: 'encounter'; p: number; card: number; option: number }
  | { k: 'foundry'; p: number }
  | { k: 'star'; p: number; star: StarId }
  | { k: 'end'; winners: number[] };

export interface Iron {
  seed: number;
  rng: RngState;
  players: number;
  turn: number;
  phase: Phase;
  terrain: Terrain[];
  /** Encounter tokens on the land (true where one waits). */
  tokens: boolean[];
  deck: number[];
  units: Unit[];
  nextId: number;
  structures: { hex: number; owner: number; kind: Structure }[];
  ps: Player[];
  cur: Turn | null;
  battle: Battle | null;
  /** The encounter card being resolved. */
  card: number | null;
  scores: Score[] | null;
  winners: number[];
  log: LogEntry[];
}

export type Action =
  | { t: 'section'; i: number }
  | { t: 'move'; unit: number; to: number }
  | { t: 'coin' }
  | { t: 'trade'; a: Res | 'pop'; b: Res | 'pop' }
  | { t: 'produce'; hex: number }
  | { t: 'upgrade'; top: Top; bottom: Bottom }
  | { t: 'deploy'; hex: number }
  | { t: 'build'; hex: number; kind: Structure }
  | { t: 'enlist'; recruit: Recruit }
  | { t: 'bid'; n: number }
  | { t: 'option'; k: number }
  | { t: 'done' };

export const fid = (g: Iron, p: number) => FACTIONS[g.ps[p]!.faction]!.id;
export const homeOf = (g: Iron, p: number) => CORNERS[HOME_CORNERS[g.players]![p]!]!;
export const homePlayer = (g: Iron, hex: number) => {
  for (let p = 0; p < g.players; p++) if (homeOf(g, p) === hex) return p;
  return -1;
};
export const unitsAt = (g: Iron, hex: number) => g.units.filter((u) => u.at === hex);
const combatUnit = (u: Unit) => u.kind !== 'worker';
export const workers = (g: Iron, p: number) =>
  g.units.filter((u) => u.owner === p && u.kind === 'worker').length;
export const hasAbility = (g: Iron, p: number, n: number) => g.ps[p]!.mechs >= n;

// ---------------------------------------------------------------------------------------------
// Set-up

function dealLand(players: number, rng: Rng): Terrain[] {
  const homes = HOME_CORNERS[players]!.map((c) => CORNERS[c]!);
  for (let tries = 0; ; tries++) {
    const terrain = new Array<Terrain>(POS.length).fill('lake');
    terrain[FOUNDRY] = 'foundry';
    const pool = rng.shuffle(TERRAIN_POOL);
    let k = 0;
    for (let s = 0; s < POS.length; s++) {
      if (s === FOUNDRY) continue;
      if (homes.includes(s)) terrain[s] = 'home';
      else terrain[s] = pool[k++] ?? 'farm';
    }
    // Homes need two different producing neighbours; lakes must not cut anyone off.
    const ok =
      homes.every((h) => {
        const kinds = new Set(ADJ[h]!.map((s) => terrain[s]).filter((x) => x && PRODUCES[x]));
        return kinds.size >= 2;
      }) &&
      homes.every((h) => {
        const seen = new Set([h]);
        const todo = [h];
        while (todo.length) {
          const u = todo.pop()!;
          for (const v of ADJ[u]!)
            if (!seen.has(v) && terrain[v] !== 'lake') {
              seen.add(v);
              todo.push(v);
            }
        }
        return seen.has(FOUNDRY);
      });
    if (ok || tries > 400) return terrain;
  }
}

export function newIron(players: number, seed: number, faction0?: number): Iron {
  const rng = new Rng(seed >>> 0);
  const rest = rng.shuffle(FACTIONS.map((_, i) => i).filter((i) => i !== faction0));
  const factions = (faction0 !== undefined ? [faction0, ...rest] : rest).slice(0, players);
  const boards = rng.shuffle(BOARDS.map((_, i) => i)).slice(0, players);
  const terrain = dealLand(players, rng);
  const g: Iron = {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    turn: 0,
    phase: 'choose',
    terrain,
    tokens: POS.map(() => false),
    deck: rng.shuffle(ENCOUNTERS.map((_, i) => i)),
    units: [],
    nextId: 0,
    structures: [],
    ps: factions.map((f, p) => ({
      faction: f,
      board: boards[p]!,
      coins: BOARDS[boards[p]!]!.coins,
      power: FACTIONS[f]!.power,
      popularity: BOARDS[boards[p]!]!.popularity,
      res: { oil: 1, metal: 1, food: 1, wood: 1 },
      improved: [],
      costs: {
        upgrade: BOTTOM.upgrade.cost,
        deploy: BOTTOM.deploy.cost - (FACTIONS[f]!.id === 'ashen' ? 1 : 0),
        build: BOTTOM.build.cost,
        enlist: BOTTOM.enlist.cost,
      },
      mechs: 0,
      structures: [],
      recruits: [],
      stars: [],
      last: -1,
      foundry: false,
      turns: 0,
    })),
    cur: null,
    battle: null,
    card: null,
    scores: null,
    winners: [],
    log: [],
  };
  // Encounter tokens: land spaces two or more steps from every home.
  const homes = g.ps.map((_, p) => homeOf(g, p));
  const far = POS.map((_, s) => s).filter((s) =>
    PRODUCES[terrain[s]!] || terrain[s] === 'village'
      ? homes.every((h) => h !== s && !ADJ[h]!.includes(s))
      : false,
  );
  for (const s of rng.shuffle(far).slice(0, ENCOUNTER_SPOTS)) g.tokens[s] = true;
  g.rng = rng.state;
  for (let p = 0; p < players; p++) {
    const home = homeOf(g, p);
    addUnit(g, 'char', p, home);
    const near = ADJ[home]!.filter((s) => PRODUCES[terrain[s]!]);
    const picked: number[] = [];
    for (const s of near)
      if (picked.length < START_WORKERS && !picked.some((x) => terrain[x] === terrain[s]))
        picked.push(s);
    for (const s of near) if (picked.length < START_WORKERS && !picked.includes(s)) picked.push(s);
    for (const s of picked) addUnit(g, 'worker', p, s);
  }
  return g;
}

function addUnit(g: Iron, kind: UnitKind, owner: number, at: number) {
  g.units.push({ id: g.nextId++, kind, owner, at });
}

// ---------------------------------------------------------------------------------------------
// Queries

export function currentPlayer(g: Iron) {
  switch (g.phase) {
    case 'defend':
      return g.battle!.defender;
    case 'over':
      return -1;
    default:
      return g.turn;
  }
}
export const sectionTop = (i: number): Top => TOPS[i]!;
export const sectionBottom = (g: Iron, p: number, i: number): Bottom =>
  BOARDS[g.ps[p]!.board]!.bottoms[i]!;
const improved = (g: Iron, p: number, top: Top) =>
  g.ps[p]!.improved.filter((x) => x === top).length;
export const movesAllowed = (g: Iron, p: number) => 2 + improved(g, p, 'move');
export const produceHexes = (g: Iron, p: number) => 2 + improved(g, p, 'produce');
export const bolsterPower = (g: Iron, p: number) => 2 + improved(g, p, 'bolster');
export const tradePopularity = (g: Iron, p: number) => 1 + improved(g, p, 'trade');
/** What producing costs p now: power, then popularity, then coins as the workforce grows. */
export function produceCost(g: Iron, p: number) {
  const w = workers(g, p);
  return { power: w >= 4 ? 1 : 0, popularity: w >= 6 ? 1 : 0, coins: w >= 8 ? 1 : 0 };
}
function canProduce(g: Iron, p: number) {
  const me = g.ps[p]!;
  const c = produceCost(g, p);
  return me.power >= c.power && me.popularity >= c.popularity && me.coins >= c.coins;
}
const hostileAt = (g: Iron, p: number, hex: number) => unitsAt(g, hex).some((u) => u.owner !== p);
const enemyCombat = (g: Iron, p: number, hex: number) =>
  unitsAt(g, hex).some((u) => u.owner !== p && combatUnit(u));

/** Spaces a unit can reach this move. */
export function reach(g: Iron, u: Unit): number[] {
  const p = u.owner;
  const fighter = u.kind !== 'worker';
  const lakes = fid(g, p) === 'salt' || (fighter && hasAbility(g, p, 2));
  const steps = fighter && hasAbility(g, p, 1) ? 2 : 1;
  const ok = (s: number) => {
    const terr = g.terrain[s]!;
    if (terr === 'lake' && !lakes) return false;
    const h = homePlayer(g, s);
    if (h >= 0 && h !== p) return false;
    if (u.kind === 'worker' && hostileAt(g, p, s)) return false;
    return true;
  };
  const out = new Set<number>();
  let frontier = [u.at];
  for (let k = 0; k < steps; k++) {
    const next: number[] = [];
    for (const s of frontier)
      for (const v of ADJ[s]!) {
        if (v === u.at || out.has(v) || !ok(v)) continue;
        out.add(v);
        // A unit stops where enemies are; lakes may be crossed only by those who may enter them.
        if (!hostileAt(g, p, v)) next.push(v);
      }
    frontier = next;
  }
  return [...out];
}

export function territories(g: Iron, p: number) {
  let n = 0;
  for (let s = 0; s < POS.length; s++) {
    if (g.terrain[s] === 'home' || g.terrain[s] === 'lake') continue;
    const here = unitsAt(g, s);
    const mine =
      here.some((u) => u.owner === p) || g.structures.some((x) => x.hex === s && x.owner === p);
    if (mine && !here.some((u) => u.owner !== p)) n += s === FOUNDRY ? FOUNDRY_WORTH : 1;
  }
  return n;
}
const totalRes = (me: Player) => RES.reduce((n, r) => n + me.res[r], 0);
export const tierOf = (popularity: number) => TIERS.find((t) => popularity <= t.upTo)!;

export function scoreAll(g: Iron): Score[] {
  return g.ps.map((me, p) => {
    const t = tierOf(me.popularity);
    const s = {
      coins: me.coins,
      stars: me.stars.length * t.star,
      territories: territories(g, p) * t.territory,
      resources: Math.floor(totalRes(me) / 2) * t.resources,
      total: 0,
    };
    s.total = s.coins + s.stars + s.territories + s.resources;
    return s;
  });
}

// ---------------------------------------------------------------------------------------------
// Legal actions

const canPayReward = (me: Player, r: Reward) =>
  me.coins >= (r.pay?.coins ?? 0) && me.popularity >= (r.pay?.popularity ?? 0);
function canBottom(g: Iron, p: number, b: Bottom) {
  const me = g.ps[p]!;
  if (me.res[BOTTOM[b].res] < me.costs[b]) return false;
  switch (b) {
    case 'upgrade':
      return me.improved.length < MAX_UPGRADES;
    case 'deploy':
      return me.mechs < MECHS && deploySpots(g, p).length > 0;
    case 'build':
      return me.structures.length < STRUCTURES.length && buildSpots(g, p).length > 0;
    case 'enlist':
      return me.recruits.length < RECRUITS.length;
  }
}
export const deploySpots = (g: Iron, p: number) => [
  ...new Set(g.units.filter((u) => u.owner === p && u.kind === 'worker').map((u) => u.at)),
];
export const buildSpots = (g: Iron, p: number) =>
  deploySpots(g, p).filter(
    (s) => !g.structures.some((x) => x.hex === s) && g.terrain[s] !== 'lake',
  );

function sectionOk(g: Iron, p: number, i: number) {
  const me = g.ps[p]!;
  if (i === me.last) return false;
  // Trade and bolster without a coin still allow the bottom action; producing must be paid.
  return sectionTop(i) !== 'produce' || canProduce(g, p);
}

export function legalActions(g: Iron): Action[] {
  const p = currentPlayer(g);
  if (p < 0) return [];
  const me = g.ps[p]!;
  const out: Action[] = [];
  switch (g.phase) {
    case 'choose':
      TOPS.forEach((_, i) => {
        if (sectionOk(g, p, i)) out.push({ t: 'section', i });
      });
      return out;
    case 'attack':
    case 'defend':
      for (let n = 0; n <= Math.min(MAX_BID, me.power); n++) out.push({ t: 'bid', n });
      return out;
    case 'encounter': {
      const card = ENCOUNTERS[g.card!]!;
      card.options.forEach((r, k) => {
        if (canPayReward(me, r)) out.push({ t: 'option', k });
      });
      if (!out.length) out.push({ t: 'option', k: 0 });
      return out;
    }
    case 'turn':
      break;
    case 'over':
      return out;
  }
  const c = g.cur!;
  if (c.step === 'bottom') {
    const b = sectionBottom(g, p, c.section);
    if (canBottom(g, p, b))
      switch (b) {
        case 'upgrade':
          for (const top of TOPS)
            if (improved(g, p, top) < TOP_STEPS[top])
              for (const bot of BOTTOMS)
                if (me.costs[bot] > BOTTOM[bot].min) out.push({ t: 'upgrade', top, bottom: bot });
          break;
        case 'deploy':
          for (const s of deploySpots(g, p)) out.push({ t: 'deploy', hex: s });
          break;
        case 'build':
          for (const s of buildSpots(g, p))
            for (const kind of STRUCTURES)
              if (!me.structures.includes(kind)) out.push({ t: 'build', hex: s, kind });
          break;
        case 'enlist':
          for (const r of RECRUITS)
            if (!me.recruits.includes(r)) out.push({ t: 'enlist', recruit: r });
          break;
      }
    out.push({ t: 'done' });
    return out;
  }
  switch (c.top) {
    case 'move':
      if (c.moved.length === 0) out.push({ t: 'coin' });
      if (c.moved.length < movesAllowed(g, p))
        for (const u of g.units)
          if (u.owner === p && !c.moved.includes(u.id))
            for (const to of reach(g, u)) out.push({ t: 'move', unit: u.id, to });
      break;
    case 'trade':
      if (me.coins >= 1) {
        out.push({ t: 'trade', a: 'pop', b: 'pop' });
        RES.forEach((a, i) => RES.slice(i).forEach((b) => out.push({ t: 'trade', a, b })));
      }
      break;
    case 'produce':
      if (c.produced.length < produceHexes(g, p))
        for (const s of deploySpots(g, p))
          if (
            !c.produced.includes(s) &&
            (PRODUCES[g.terrain[s]!] || (g.terrain[s] === 'village' && workers(g, p) < MAX_WORKERS))
          )
            out.push({ t: 'produce', hex: s });
      break;
    case 'bolster':
      break;
  }
  out.push({ t: 'done' });
  return out;
}

const same = (a: Action, b: Action) => JSON.stringify(a) === JSON.stringify(b);
export const isLegal = (g: Iron, a: Action) => legalActions(g).some((b) => same(a, b));

// ---------------------------------------------------------------------------------------------
// Applying actions

export function act(state: Iron, a: Action): Iron {
  if (!isLegal(state, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  return apply(state, a);
}

/** Applies an action already known to be legal (the AI's own simulations). */
export function apply(state: Iron, a: Action): Iron {
  const g = structuredClone(state);
  const p = currentPlayer(g);
  const me = g.ps[p]!;
  switch (a.t) {
    case 'section': {
      const top = sectionTop(a.i);
      g.cur = { section: a.i, top, moved: [], produced: [], step: 'top' };
      me.last = a.i;
      g.phase = 'turn';
      g.log.push({ k: 'section', p, top });
      if (top === 'produce') {
        const cost = produceCost(g, p);
        me.power -= cost.power;
        me.popularity -= cost.popularity;
        me.coins -= cost.coins;
      }
      if (top === 'bolster') {
        if (me.coins >= 1) {
          me.coins--;
          me.power = Math.min(MAX_POWER, me.power + bolsterPower(g, p));
          g.log.push({ k: 'bolster', p, power: bolsterPower(g, p) });
          if (me.structures.includes('armory')) me.power = Math.min(MAX_POWER, me.power + 1);
        }
        toBottom(g, p);
      } else if (top === 'trade' && me.coins < 1) toBottom(g, p);
      break;
    }
    case 'coin':
      me.coins++;
      g.log.push({ k: 'coin', p });
      toBottom(g, p);
      break;
    case 'move':
      doMove(g, p, a.unit, a.to);
      break;
    case 'trade': {
      me.coins--;
      if (a.a === 'pop') {
        gainPop(me, tradePopularity(g, p));
        g.log.push({ k: 'trade', p, got: 'pop' });
      } else {
        me.res[a.a]++;
        me.res[a.b as Res]++;
        if (fid(g, p) === 'ember') me.res[a.a]++;
        g.log.push({ k: 'trade', p, got: `${a.a}+${a.b}` });
      }
      toBottom(g, p);
      break;
    }
    case 'produce': {
      const terr = g.terrain[a.hex]!;
      const n = g.units.filter(
        (u) => u.owner === p && u.kind === 'worker' && u.at === a.hex,
      ).length;
      g.cur!.produced.push(a.hex);
      if (terr === 'village') {
        const k = Math.min(n, MAX_WORKERS - workers(g, p));
        for (let i = 0; i < k; i++) addUnit(g, 'worker', p, a.hex);
        g.log.push({ k: 'produce', p, hex: a.hex, what: 'worker', n: k });
      } else {
        const r = PRODUCES[terr]!;
        let k = n;
        if (g.structures.some((x) => x.hex === a.hex && x.owner === p && x.kind === 'mill')) k++;
        if (r === 'wood' && fid(g, p) === 'thorn') k++;
        me.res[r] += k;
        g.log.push({ k: 'produce', p, hex: a.hex, what: r, n: k });
      }
      if (g.cur!.produced.length >= produceHexes(g, p)) toBottom(g, p);
      break;
    }
    case 'upgrade':
      payBottom(g, p, 'upgrade');
      me.improved.push(a.top);
      me.costs[a.bottom]--;
      g.log.push({ k: 'upgrade', p, top: a.top, bottom: a.bottom });
      endTurn(g, p);
      break;
    case 'deploy':
      payBottom(g, p, 'deploy');
      addUnit(g, 'mech', p, a.hex);
      me.mechs++;
      g.log.push({ k: 'deploy', p, hex: a.hex });
      endTurn(g, p);
      break;
    case 'build':
      payBottom(g, p, 'build');
      g.structures.push({ hex: a.hex, owner: p, kind: a.kind });
      me.structures.push(a.kind);
      if (a.kind === 'monument') gainPop(me, 2);
      if (a.kind === 'armory') me.power = Math.min(MAX_POWER, me.power + 2);
      g.log.push({ k: 'build', p, hex: a.hex, kind: a.kind });
      endTurn(g, p);
      break;
    case 'enlist':
      payBottom(g, p, 'enlist');
      me.recruits.push(a.recruit);
      if (a.recruit === 'power') me.power = Math.min(MAX_POWER, me.power + 2);
      if (a.recruit === 'coins') me.coins += 2;
      if (a.recruit === 'popularity') gainPop(me, 2);
      if (a.recruit === 'supplies') for (const r of RES) me.res[r]++;
      g.log.push({ k: 'enlist', p, recruit: a.recruit });
      endTurn(g, p);
      break;
    case 'bid':
      if (g.phase === 'attack') {
        g.battle!.attackBid = a.n;
        g.phase = 'defend';
      } else resolveBattle(g, a.n);
      break;
    case 'option': {
      const r = ENCOUNTERS[g.card!]!.options[a.k]!;
      g.log.push({ k: 'encounter', p, card: g.card!, option: a.k });
      if (canPayReward(me, r)) reward(g, p, r, homeOf(g, p));
      g.card = null;
      g.phase = 'turn';
      afterMoveStep(g, p);
      break;
    }
    case 'done':
      if (g.cur!.step === 'top') toBottom(g, p);
      else endTurn(g, p);
      break;
  }
  checkStars(g);
  return g;
}

const gainPop = (me: Player, n: number) => {
  me.popularity = Math.max(0, Math.min(MAX_POPULARITY, me.popularity + n));
};
function payBottom(g: Iron, p: number, b: Bottom) {
  const me = g.ps[p]!;
  me.res[BOTTOM[b].res] -= me.costs[b];
  me.coins += BOTTOM[b].coins;
}
function reward(g: Iron, p: number, r: Reward, at: number) {
  const me = g.ps[p]!;
  me.coins -= r.pay?.coins ?? 0;
  me.popularity -= r.pay?.popularity ?? 0;
  me.coins += r.coins ?? 0;
  gainPop(me, r.popularity ?? 0);
  me.power = Math.min(MAX_POWER, me.power + (r.power ?? 0));
  for (const k of RES) me.res[k] += r.res?.[k] ?? 0;
  if (r.worker && workers(g, p) < MAX_WORKERS) addUnit(g, 'worker', p, at);
}

function doMove(g: Iron, p: number, id: number, to: number) {
  const u = g.units.find((x) => x.id === id)!;
  g.cur!.moved.push(id);
  u.at = to;
  g.log.push({ k: 'move', p, unit: u.kind, to });
  if (u.kind === 'worker') {
    afterMoveStep(g, p);
    return;
  }
  const d = unitsAt(g, to).find((x) => x.owner !== p)?.owner ?? -1;
  if (d >= 0 && enemyCombat(g, p, to)) {
    g.battle = { hex: to, attacker: p, defender: d, attackBid: null };
    g.phase = 'attack';
    return;
  }
  if (d >= 0) scatter(g, p, d, to);
  arrive(g, p, u);
}

/** Enemy workers alone on a space go home; the mover loses popularity for each. */
function scatter(g: Iron, p: number, d: number, hex: number) {
  const ws = g.units.filter((x) => x.owner === d && x.at === hex);
  for (const w of ws) w.at = homeOf(g, d);
  gainPop(g.ps[p]!, -ws.length);
  if (ws.length) g.log.push({ k: 'scatter', p, d, hex, n: ws.length });
}

/** The character's arrival: the Foundry bonus and encounters. */
function arrive(g: Iron, p: number, u: Unit) {
  const me = g.ps[p]!;
  if (u.kind === 'char') {
    if (u.at === FOUNDRY && !me.foundry) {
      me.foundry = true;
      reward(g, p, FOUNDRY_BONUS, u.at);
      g.log.push({ k: 'foundry', p });
    }
    if (g.tokens[u.at] && g.deck.length) {
      g.tokens[u.at] = false;
      g.card = g.deck.shift()!;
      g.phase = 'encounter';
      return;
    }
  }
  afterMoveStep(g, p);
}

function afterMoveStep(g: Iron, p: number) {
  if (g.phase === 'over') return;
  g.phase = 'turn';
  const c = g.cur!;
  if (c.moved.length >= movesAllowed(g, p) || !legalActions(g).some((a) => a.t === 'move'))
    toBottom(g, p);
}

function resolveBattle(g: Iron, defendBid: number) {
  const b = g.battle!;
  const A = g.ps[b.attacker]!;
  const D = g.ps[b.defender]!;
  const here = unitsAt(g, b.hex);
  const aUnits = here.filter((u) => u.owner === b.attacker && combatUnit(u)).length;
  const dUnits = here.filter((u) => u.owner === b.defender && combatUnit(u)).length;
  const aBid = b.attackBid!;
  const a =
    aBid +
    aUnits +
    (hasAbility(g, b.attacker, 4) ? 2 : 0) +
    (fid(g, b.attacker) === 'crown' ? 2 : 0);
  const dv = defendBid + dUnits + (hasAbility(g, b.defender, 3) ? 2 : 0);
  A.power -= aBid;
  D.power -= defendBid;
  const won = a >= dv;
  const [winner, loser] = won ? [b.attacker, b.defender] : [b.defender, b.attacker];
  g.log.push({ k: 'battle', p: b.attacker, d: b.defender, hex: b.hex, a, dv, won });
  // The loser's units on the space go home.
  for (const u of here) if (u.owner === loser) u.at = homeOf(g, loser);
  if (g.ps[winner]!.stars.filter((s) => s === 'combat').length < COMBAT_STARS)
    addStar(g, winner, 'combat');
  if (g.phase === 'over') return;
  g.battle = null;
  g.phase = 'turn';
  if (won) {
    const mover = unitsAt(g, b.hex).find((u) => u.owner === b.attacker && u.kind === 'char');
    if (mover) {
      arrive(g, b.attacker, mover);
      return;
    }
  }
  afterMoveStep(g, b.attacker);
}

function toBottom(g: Iron, p: number) {
  const c = g.cur!;
  c.step = 'bottom';
  if (!canBottom(g, p, sectionBottom(g, p, c.section))) endTurn(g, p);
}

function endTurn(g: Iron, p: number) {
  if (g.phase === 'over') return;
  const me = g.ps[p]!;
  if (g.cur?.top === 'move' && me.structures.includes('mine')) me.coins++;
  me.turns++;
  g.cur = null;
  g.phase = 'choose';
  checkStars(g);
  if ((g.phase as string) === 'over') return;
  if (g.ps.every((x) => x.turns >= MAX_TURNS)) {
    finish(g);
    return;
  }
  g.turn = (g.turn + 1) % g.players;
}

function addStar(g: Iron, p: number, s: StarId) {
  g.ps[p]!.stars.push(s);
  g.log.push({ k: 'star', p, star: s });
  if (g.ps[p]!.stars.length >= STARS_TO_END) finish(g);
}

/** Whether the game has ended (read fresh: stars may end it in the middle of an action). */
const over = (g: Iron) => g.phase === 'over';

function checkStars(g: Iron) {
  if (g.phase === 'over') return;
  g.ps.forEach((me, p) => {
    if (g.phase === 'over') return;
    const want: [StarId, boolean][] = [
      ['upgrades', me.improved.length >= STAR_AT.upgrades],
      ['mechs', me.mechs >= STAR_AT.mechs],
      ['structures', me.structures.length >= STAR_AT.structures],
      ['recruits', me.recruits.length >= STAR_AT.recruits],
      ['workers', workers(g, p) >= STAR_AT.workers],
      ['power', me.power >= STAR_AT.power],
      ['popularity', me.popularity >= STAR_AT.popularity],
    ];
    for (const [s, ok] of want) if (ok && !me.stars.includes(s) && !over(g)) addStar(g, p, s);
  });
}

function finish(g: Iron) {
  g.scores = scoreAll(g);
  const best = Math.max(...g.scores.map((s) => s.total));
  g.winners = g.ps.map((_, p) => p).filter((p) => g.scores![p]!.total === best);
  g.phase = 'over';
  g.cur = null;
  g.battle = null;
  g.card = null;
  g.log.push({ k: 'end', winners: g.winners });
}

// ---------------------------------------------------------------------------------------------
// Validation

export function isValidIron(d: unknown): d is Iron {
  if (typeof d !== 'object' || d === null) return false;
  const g = d as Iron;
  if (![2, 3, 4].includes(g.players)) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  if (!['choose', 'turn', 'attack', 'defend', 'encounter', 'over'].includes(g.phase)) return false;
  if (!Array.isArray(g.terrain) || g.terrain.length !== POS.length) return false;
  if (!Array.isArray(g.tokens) || g.tokens.length !== POS.length) return false;
  if (
    !Array.isArray(g.deck) ||
    !g.deck.every((x) => Number.isInteger(x) && x >= 0 && x < ENCOUNTERS.length)
  )
    return false;
  if (
    !Array.isArray(g.units) ||
    !g.units.every(
      (u) =>
        Number.isInteger(u.at) &&
        u.at >= 0 &&
        u.at < POS.length &&
        Number.isInteger(u.owner) &&
        u.owner >= 0 &&
        u.owner < g.players &&
        ['char', 'worker', 'mech'].includes(u.kind),
    )
  )
    return false;
  if (!Array.isArray(g.ps) || g.ps.length !== g.players) return false;
  for (const me of g.ps) {
    if (!Number.isInteger(me.faction) || me.faction < 0 || me.faction >= FACTIONS.length)
      return false;
    if (!Number.isInteger(me.board) || me.board < 0 || me.board >= BOARDS.length) return false;
    if (![me.coins, me.power, me.popularity].every((x) => Number.isInteger(x) && x >= 0))
      return false;
    if (me.power > MAX_POWER || me.popularity > MAX_POPULARITY) return false;
    if (!RES.every((r) => Number.isInteger(me.res?.[r]) && me.res[r] >= 0)) return false;
    if (!Array.isArray(me.stars) || !Array.isArray(me.improved)) return false;
  }
  if ((g.phase === 'attack' || g.phase === 'defend') !== (g.battle !== null)) return false;
  if ((g.phase === 'encounter') !== (g.card !== null)) return false;
  return Array.isArray(g.log) && Array.isArray(g.structures);
}
