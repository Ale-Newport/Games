/**
 * Planet Shapers rules (pure): an engine-building race to shape the planet Kepra for 2–4
 * players. Each generation: research (buy cards), actions (one per turn until everyone passes:
 * play a card, a standard project, convert flora or heat, use a card action, sell a card, claim
 * a milestone, fund an award), production. Raising heat, air and seas earns shaping rating (TR),
 * which is both income and points. When all three parameters are complete the game ends after
 * that generation's production; points are TR, milestones, awards, groves, settlements and
 * cards. Deck order comes from the seeded generator stored in the state.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import {
  ADJ,
  AWARD_COSTS,
  AWARDS,
  BASINS,
  BONUS,
  CARD_BONUS,
  CARD_PRICE,
  CARDS,
  CORPS,
  GROVE_FLORA,
  HEAT_HEAT,
  HEAT_PROD_STEPS,
  HEAT_SEA_STEP,
  AIR_HEAT_STEP,
  MAX,
  MAX_CLAIMED,
  MAX_GEN,
  MILESTONE_COST,
  MILESTONE_VP,
  MILESTONES,
  MIN_CREDIT_PROD,
  PARAMS,
  POS,
  RES,
  RESEARCH,
  START_CARDS,
  START_TR,
  STD,
  type Amounts,
  type CardDef,
  type Param,
  type Res,
  type StdId,
  type Tag,
} from './world';

export type TileKind = 'sea' | 'grove' | 'settlement';
export interface Tile {
  kind: TileKind;
  /** −1 for seas. */
  owner: number;
}
export interface Player {
  corp: number;
  options: number[];
  tr: number;
  res: Record<Res, number>;
  prod: Record<Res, number>;
  hand: number[];
  /** Played automatic, action and effect cards (tags count) and played events (they do not). */
  played: number[];
  events: number[];
  /** Action cards used this generation. */
  used: number[];
  /** Cards offered in research. */
  offer: number[];
  passed: boolean;
}
export interface Pending {
  kind: TileKind;
  p: number;
}
export type Phase = 'setup' | 'research' | 'action' | 'place' | 'over';
export interface Score {
  tr: number;
  milestones: number;
  awards: number;
  groves: number;
  settlements: number;
  cards: number;
  total: number;
}
export type LogEntry =
  | { k: 'gen'; gen: number }
  | { k: 'corp'; p: number; corp: number }
  | { k: 'buy'; p: number; n: number }
  | { k: 'play'; p: number; card: number }
  | { k: 'std'; p: number; id: StdId }
  | { k: 'convert'; p: number; what: 'flora' | 'heat' }
  | { k: 'use'; p: number; card: number }
  | { k: 'sell'; p: number; card: number }
  | { k: 'claim'; p: number; m: number }
  | { k: 'fund'; p: number; a: number }
  | { k: 'tile'; p: number; kind: TileKind; space: number }
  | { k: 'raise'; p: number; param: Param; to: number }
  | { k: 'pass'; p: number }
  | { k: 'production'; gen: number }
  | { k: 'end'; winners: number[] };

export interface Shapers {
  seed: number;
  rng: RngState;
  players: number;
  gen: number;
  first: number;
  turn: number;
  phase: Phase;
  params: Record<Param, number>;
  tiles: (Tile | null)[];
  deck: number[];
  discard: number[];
  ps: Player[];
  /** Players still to choose (setup) or buy (research). */
  queue: number[];
  /** Corporations in dealing order (options are the first two nobody has seen or taken). */
  corps: number[];
  pending: Pending[];
  claimed: { m: number; p: number }[];
  funded: { a: number; p: number }[];
  scores: Score[] | null;
  winners: number[];
  log: LogEntry[];
}

export type Action =
  | { t: 'corp'; i: number }
  | { t: 'buy'; mask: number }
  | { t: 'play'; card: number }
  | { t: 'std'; id: StdId }
  | { t: 'convert'; what: 'flora' | 'heat' }
  | { t: 'use'; card: number }
  | { t: 'sell'; card: number }
  | { t: 'claim'; m: number }
  | { t: 'fund'; a: number }
  | { t: 'tile'; space: number }
  | { t: 'pass' };

const zero = (): Record<Res, number> => ({
  credits: 0,
  ore: 0,
  crystal: 0,
  flora: 0,
  power: 0,
  heat: 0,
});
const corpId = (g: Shapers, p: number) => CORPS[g.ps[p]!.corp]?.id;
export const card = (i: number): CardDef => CARDS[i]!;

// ---------------------------------------------------------------------------------------------
// Set-up and drawing

function draw(g: Shapers, n: number): number[] {
  const rng = new Rng(g.rng);
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    if (!g.deck.length) {
      if (!g.discard.length) break;
      g.deck = rng.shuffle(g.discard);
      g.discard = [];
    }
    out.push(g.deck.shift()!);
  }
  g.rng = rng.state;
  return out;
}

export function newShapers(players: number, seed: number): Shapers {
  const rng = new Rng(seed >>> 0);
  const corps = rng.shuffle(CORPS.map((_, i) => i));
  const g: Shapers = {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    gen: 1,
    first: 0,
    turn: 0,
    phase: 'setup',
    params: { heat: 0, air: 0, sea: 0 },
    tiles: POS.map(() => null),
    deck: rng.shuffle(CARDS.map((_, i) => i)),
    discard: [],
    ps: Array.from({ length: players }, (_, p) => ({
      corp: -1,
      options: p === 0 ? [corps[0]!, corps[1]!] : [],
      tr: START_TR,
      res: zero(),
      prod: zero(),
      hand: [],
      played: [],
      events: [],
      used: [],
      offer: [],
      passed: false,
    })),
    queue: Array.from({ length: players }, (_, p) => p),
    corps,
    pending: [],
    claimed: [],
    funded: [],
    scores: null,
    winners: [],
    log: [{ k: 'gen', gen: 1 }],
  };
  g.rng = rng.state;
  for (const x of g.ps) x.offer = draw(g, START_CARDS);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Queries

export function currentPlayer(g: Shapers) {
  switch (g.phase) {
    case 'setup':
    case 'research':
      return g.queue[0] ?? -1;
    case 'place':
      return g.pending[0]!.p;
    case 'action':
      return g.turn;
    case 'over':
      return -1;
  }
}
/** Tags on p's played cards (events excluded). */
export function tagCount(g: Shapers, p: number, tag: Tag) {
  return g.ps[p]!.played.reduce((n, c) => n + card(c).tags.filter((t) => t === tag).length, 0);
}
export const tilesOf = (g: Shapers, p: number, kind?: TileKind) =>
  g.tiles.filter((t) => t && t.owner === p && (!kind || t.kind === kind)).length;
export const researchPrice = (g: Shapers, p: number) =>
  corpId(g, p) === 'archive' ? 2 : CARD_PRICE;
export const groveCost = (g: Shapers, p: number) =>
  corpId(g, p) === 'verdance' ? GROVE_FLORA - 1 : GROVE_FLORA;
export const heatCost = (g: Shapers, p: number) =>
  corpId(g, p) === 'thermos' ? HEAT_HEAT - 1 : HEAT_HEAT;
const oreValue = (g: Shapers, p: number) => (corpId(g, p) === 'forgeline' ? 3 : 2);
const crystalValue = (g: Shapers, p: number) => (corpId(g, p) === 'skyreach' ? 4 : 3);

/** What card i costs p after its discounts. */
export function costOf(g: Shapers, p: number, i: number) {
  const d = card(i);
  let cost = d.cost;
  for (const c of g.ps[p]!.played) {
    const disc = card(c).effect?.discount;
    if (disc && (!disc.tag || d.tags.includes(disc.tag))) cost -= disc.n;
  }
  return Math.max(0, cost);
}
/** How p would pay card i: crystal on Space cards, ore on Build cards, then credits. */
export function paymentFor(g: Shapers, p: number, i: number) {
  const d = card(i);
  const me = g.ps[p]!;
  let left = costOf(g, p, i);
  let crystal = 0;
  let ore = 0;
  const cv = crystalValue(g, p);
  const ov = oreValue(g, p);
  if (d.tags.includes('space')) {
    crystal = Math.min(me.res.crystal, Math.floor(left / cv));
    left -= crystal * cv;
  }
  if (d.tags.includes('build')) {
    ore = Math.min(me.res.ore, Math.floor(left / ov));
    left -= ore * ov;
  }
  if (left > me.res.credits) {
    // One more unit, overpaying, if that is what it takes.
    if (d.tags.includes('space') && crystal < me.res.crystal && left - cv <= me.res.credits) {
      crystal++;
      left = Math.max(0, left - cv);
    } else if (d.tags.includes('build') && ore < me.res.ore && left - ov <= me.res.credits) {
      ore++;
      left = Math.max(0, left - ov);
    } else return null;
  }
  return { credits: left, ore, crystal };
}

export function meetsReq(g: Shapers, p: number, i: number) {
  const r = card(i).req;
  if (!r) return true;
  if (r.param) {
    const v = g.params[r.param];
    if (r.min !== undefined && v < r.min) return false;
    if (r.max !== undefined && v > r.max) return false;
  }
  if (r.tag && tagCount(g, p, r.tag) < (r.count ?? 1)) return false;
  return true;
}
function prodOk(g: Shapers, p: number, prod: Amounts | undefined) {
  if (!prod) return true;
  const me = g.ps[p]!;
  return RES.every((r) => {
    const v = me.prod[r] + (prod[r] ?? 0);
    return r === 'credits' ? v >= MIN_CREDIT_PROD : v >= 0;
  });
}
const has = (g: Shapers, p: number, a: Amounts | undefined) =>
  !a || RES.every((r) => g.ps[p]!.res[r] >= (a[r] ?? 0));

/** Seas that can still be placed (counting those waiting to be placed). */
const seasLeft = (g: Shapers) =>
  Math.min(
    MAX.sea - g.params.sea - g.pending.filter((x) => x.kind === 'sea').length,
    BASINS.filter((s) => !g.tiles[s]).length - g.pending.filter((x) => x.kind === 'sea').length,
  );

/** Spaces where p may put a tile of this kind. */
export function spotsFor(g: Shapers, p: number, kind: TileKind): number[] {
  const free = POS.map((_, s) => s).filter((s) => !g.tiles[s]);
  if (kind === 'sea') return free.filter((s) => BASINS.includes(s));
  const land = free.filter((s) => !BASINS.includes(s));
  if (kind === 'settlement')
    return land.filter((s) => ADJ[s]!.every((t) => g.tiles[t]?.kind !== 'settlement'));
  const near = land.filter((s) => ADJ[s]!.some((t) => g.tiles[t] && g.tiles[t]!.owner === p));
  return near.length ? near : land;
}

export function milestoneMet(g: Shapers, p: number, m: number) {
  switch (MILESTONES[m]!) {
    case 'shaper':
      return g.ps[p]!.tr >= 30;
    case 'mayor':
      return tilesOf(g, p, 'settlement') >= 3;
    case 'planter':
      return tilesOf(g, p, 'grove') >= 3;
    case 'builder':
      return tagCount(g, p, 'build') >= 6;
    case 'scholar':
      return tagCount(g, p, 'science') >= 4;
  }
}
export function awardMetric(g: Shapers, p: number, a: number) {
  const me = g.ps[p]!;
  switch (AWARDS[a]!) {
    case 'landlord':
      return tilesOf(g, p);
    case 'banker':
      return me.prod.credits;
    case 'scientist':
      return tagCount(g, p, 'science');
    case 'thermalist':
      return me.res.heat;
    case 'miner':
      return me.res.ore + me.res.crystal;
  }
}

function canPlay(g: Shapers, p: number, i: number) {
  const d = card(i);
  if (!meetsReq(g, p, i) || !prodOk(g, p, d.prod) || !paymentFor(g, p, i)) return false;
  // A grove or settlement must have somewhere to go.
  return (d.tiles ?? []).every((k) => spotsFor(g, p, k).length > 0);
}
function canUse(g: Shapers, p: number, i: number) {
  const a = card(i).action!;
  if (g.ps[p]!.used.includes(i) || !has(g, p, a.pay)) return false;
  if (a.raise?.sea && seasLeft(g) <= 0) return false;
  if (a.raise?.air && g.params.air >= MAX.air) return false;
  if (a.raise?.heat && g.params.heat >= MAX.heat) return false;
  return true;
}
function canStd(g: Shapers, p: number, id: StdId) {
  const cost = STD.find((s) => s.id === id)!.cost;
  if (g.ps[p]!.res.credits < cost) return false;
  switch (id) {
    case 'power':
      return true;
    case 'heater':
      return g.params.heat < MAX.heat;
    case 'aquifer':
      return seasLeft(g) > 0;
    case 'grove':
      return spotsFor(g, p, 'grove').length > 0;
    case 'settlement':
      return spotsFor(g, p, 'settlement').length > 0;
  }
}

// ---------------------------------------------------------------------------------------------
// Legal actions

export function legalActions(g: Shapers): Action[] {
  const p = currentPlayer(g);
  if (p < 0) return [];
  const me = g.ps[p]!;
  const out: Action[] = [];
  if (g.phase === 'setup' && me.corp < 0) {
    me.options.forEach((_, i) => out.push({ t: 'corp', i }));
    return out;
  }
  if (g.phase === 'setup' || g.phase === 'research') {
    const price = researchPrice(g, p);
    const n = me.offer.length;
    for (let mask = 0; mask < 1 << n; mask++) {
      let bits = 0;
      for (let k = 0; k < n; k++) if (mask & (1 << k)) bits++;
      if (bits * price <= me.res.credits) out.push({ t: 'buy', mask });
    }
    return out;
  }
  if (g.phase === 'place') {
    for (const s of spotsFor(g, p, g.pending[0]!.kind)) out.push({ t: 'tile', space: s });
    return out;
  }
  for (const i of me.hand) if (canPlay(g, p, i)) out.push({ t: 'play', card: i });
  for (const s of STD) if (canStd(g, p, s.id)) out.push({ t: 'std', id: s.id });
  if (me.res.flora >= groveCost(g, p) && spotsFor(g, p, 'grove').length)
    out.push({ t: 'convert', what: 'flora' });
  if (me.res.heat >= heatCost(g, p) && g.params.heat < MAX.heat)
    out.push({ t: 'convert', what: 'heat' });
  for (const i of me.played) if (card(i).action && canUse(g, p, i)) out.push({ t: 'use', card: i });
  if (g.claimed.length < MAX_CLAIMED && me.res.credits >= MILESTONE_COST)
    MILESTONES.forEach((_, m) => {
      if (!g.claimed.some((x) => x.m === m) && milestoneMet(g, p, m)) out.push({ t: 'claim', m });
    });
  if (g.funded.length < AWARD_COSTS.length && me.res.credits >= AWARD_COSTS[g.funded.length]!)
    AWARDS.forEach((_, a) => {
      if (!g.funded.some((x) => x.a === a)) out.push({ t: 'fund', a });
    });
  for (const i of me.hand) out.push({ t: 'sell', card: i });
  out.push({ t: 'pass' });
  return out;
}

const same = (a: Action, b: Action) => JSON.stringify(a) === JSON.stringify(b);
export const isLegal = (g: Shapers, a: Action) => legalActions(g).some((b) => same(a, b));

// ---------------------------------------------------------------------------------------------
// Applying actions

function gain(g: Shapers, p: number, a: Amounts | undefined, sign = 1) {
  if (!a) return;
  for (const r of RES) g.ps[p]!.res[r] += sign * (a[r] ?? 0);
}
function addProd(g: Shapers, p: number, a: Amounts | undefined) {
  if (!a) return;
  for (const r of RES) g.ps[p]!.prod[r] += a[r] ?? 0;
}

/** Raises a parameter n steps for p (seas wait to be placed). */
function raise(g: Shapers, p: number, param: Param, n: number) {
  for (let k = 0; k < n; k++) {
    if (param === 'sea') {
      if (seasLeft(g) > 0) g.pending.push({ kind: 'sea', p });
      continue;
    }
    if (g.params[param] >= MAX[param]) return;
    g.params[param]++;
    g.ps[p]!.tr++;
    const v = g.params[param];
    g.log.push({ k: 'raise', p, param, to: v });
    if (param === 'heat' && HEAT_PROD_STEPS.includes(v)) g.ps[p]!.prod.heat++;
    if (param === 'heat' && v === HEAT_SEA_STEP) raise(g, p, 'sea', 1);
    if (param === 'air' && v === AIR_HEAT_STEP) raise(g, p, 'heat', 1);
  }
}

function placeTile(g: Shapers, p: number, kind: TileKind, s: number) {
  g.tiles[s] = { kind, owner: kind === 'sea' ? -1 : p };
  g.log.push({ k: 'tile', p, kind, space: s });
  gain(g, p, BONUS[s]);
  if (CARD_BONUS.has(s)) g.ps[p]!.hand.push(...draw(g, 1));
  const seas = ADJ[s]!.filter((t) => g.tiles[t]?.kind === 'sea').length;
  g.ps[p]!.res.credits += 2 * seas;
  if (kind === 'sea') {
    g.params.sea++;
    g.ps[p]!.tr++;
    g.log.push({ k: 'raise', p, param: 'sea', to: g.params.sea });
  }
  if (kind === 'grove') raise(g, p, 'air', 1);
}

function playCard(g: Shapers, p: number, i: number) {
  const me = g.ps[p]!;
  const d = card(i);
  const pay = paymentFor(g, p, i)!;
  me.res.credits -= pay.credits;
  me.res.ore -= pay.ore;
  me.res.crystal -= pay.crystal;
  me.hand.splice(me.hand.indexOf(i), 1);
  if (d.kind === 'event') me.events.push(i);
  else me.played.push(i);
  g.log.push({ k: 'play', p, card: i });
  if (corpId(g, p) === 'meridian' && costOf(g, p, i) >= 20) me.res.credits += 4;
  addProd(g, p, d.prod);
  gain(g, p, d.gain);
  if (d.tr) me.tr += d.tr;
  if (d.draw) me.hand.push(...draw(g, d.draw));
  for (const t of d.tiles ?? []) g.pending.push({ kind: t, p });
  for (const param of PARAMS) if (d.raise?.[param]) raise(g, p, param, d.raise[param]!);
  // Triggers from played effects (this card included).
  for (const c of me.played) {
    const on = card(c).effect?.onTag;
    if (on && d.tags.includes(on.tag)) gain(g, p, on.gain);
  }
}

export function act(state: Shapers, a: Action): Shapers {
  if (!isLegal(state, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g = structuredClone(state);
  const p = currentPlayer(g);
  const me = g.ps[p]!;
  switch (a.t) {
    case 'corp': {
      me.corp = me.options[a.i]!;
      const c = CORPS[me.corp]!;
      me.res.credits = c.credits;
      addProd(g, p, c.prod);
      g.log.push({ k: 'corp', p, corp: me.corp });
      return g;
    }
    case 'buy': {
      const keep = me.offer.filter((_, k) => a.mask & (1 << k));
      me.res.credits -= keep.length * researchPrice(g, p);
      me.hand.push(...keep);
      g.discard.push(...me.offer.filter((_, k) => !(a.mask & (1 << k))));
      me.offer = [];
      g.log.push({ k: 'buy', p, n: keep.length });
      g.queue.shift();
      if (g.phase === 'setup' && g.queue.length) dealOptions(g, g.queue[0]!);
      if (!g.queue.length) startActions(g);
      return g;
    }
    case 'tile': {
      const pend = g.pending.shift()!;
      placeTile(g, p, pend.kind, a.space);
      afterAction(g);
      return g;
    }
    case 'play':
      playCard(g, p, a.card);
      break;
    case 'std': {
      const cost = STD.find((s) => s.id === a.id)!.cost;
      me.res.credits -= cost;
      g.log.push({ k: 'std', p, id: a.id });
      if (corpId(g, p) === 'meridian' && cost >= 20) me.res.credits += 4;
      if (a.id === 'power') me.prod.power++;
      else if (a.id === 'heater') raise(g, p, 'heat', 1);
      else if (a.id === 'aquifer') raise(g, p, 'sea', 1);
      else if (a.id === 'grove') g.pending.push({ kind: 'grove', p });
      else {
        me.prod.credits++;
        g.pending.push({ kind: 'settlement', p });
      }
      break;
    }
    case 'convert':
      g.log.push({ k: 'convert', p, what: a.what });
      if (a.what === 'flora') {
        me.res.flora -= groveCost(g, p);
        g.pending.push({ kind: 'grove', p });
      } else {
        me.res.heat -= heatCost(g, p);
        raise(g, p, 'heat', 1);
      }
      break;
    case 'use': {
      const ac = card(a.card).action!;
      me.used.push(a.card);
      g.log.push({ k: 'use', p, card: a.card });
      gain(g, p, ac.pay, -1);
      gain(g, p, ac.gain);
      if (ac.draw) me.hand.push(...draw(g, ac.draw));
      for (const param of PARAMS) if (ac.raise?.[param]) raise(g, p, param, ac.raise[param]!);
      break;
    }
    case 'sell':
      me.hand.splice(me.hand.indexOf(a.card), 1);
      g.discard.push(a.card);
      me.res.credits++;
      g.log.push({ k: 'sell', p, card: a.card });
      break;
    case 'claim':
      me.res.credits -= MILESTONE_COST;
      g.claimed.push({ m: a.m, p });
      g.log.push({ k: 'claim', p, m: a.m });
      break;
    case 'fund':
      me.res.credits -= AWARD_COSTS[g.funded.length]!;
      g.funded.push({ a: a.a, p });
      g.log.push({ k: 'fund', p, a: a.a });
      break;
    case 'pass':
      me.passed = true;
      g.log.push({ k: 'pass', p });
      break;
  }
  afterAction(g);
  return g;
}

/** Places what can be placed, or moves to the next turn. */
function afterAction(g: Shapers) {
  // Drop placements with nowhere to go.
  while (g.pending.length && !spotsFor(g, g.pending[0]!.p, g.pending[0]!.kind).length)
    g.pending.shift();
  if (g.pending.length) {
    g.phase = 'place';
    return;
  }
  g.phase = 'action';
  for (let k = 1; k <= g.players; k++) {
    const q = (g.turn + k) % g.players;
    if (!g.ps[q]!.passed) {
      g.turn = q;
      return;
    }
  }
  production(g);
}

/** Two corporations for p: ones nobody has been offered if possible, else any not taken. */
function dealOptions(g: Shapers, p: number) {
  const taken = g.ps.map((x) => x.corp);
  const seen = g.ps.flatMap((x) => x.options);
  const free = g.corps.filter((c) => !taken.includes(c));
  const fresh = free.filter((c) => !seen.includes(c));
  g.ps[p]!.options = (fresh.length >= 2 ? fresh : free).slice(0, 2);
}

function startActions(g: Shapers) {
  g.phase = 'action';
  g.turn = g.first;
  for (const x of g.ps) {
    x.passed = false;
    x.used = [];
  }
}

export const complete = (g: Shapers) => PARAMS.every((p) => g.params[p] >= MAX[p]);

function production(g: Shapers) {
  for (const x of g.ps) {
    x.res.heat += x.res.power;
    x.res.power = 0;
    for (const r of RES) x.res[r] += x.prod[r];
    x.res.credits += x.tr;
  }
  g.log.push({ k: 'production', gen: g.gen });
  if (complete(g) || g.gen >= MAX_GEN) {
    finish(g);
    return;
  }
  g.gen++;
  g.first = (g.first + 1) % g.players;
  g.log.push({ k: 'gen', gen: g.gen });
  g.phase = 'research';
  g.queue = Array.from({ length: g.players }, (_, k) => (g.first + k) % g.players);
  for (let p = 0; p < g.players; p++)
    g.ps[p]!.offer = draw(g, RESEARCH + (corpId(g, p) === 'archive' ? 1 : 0));
}

/** Final points of every player. */
export function scoreAll(g: Shapers): Score[] {
  const awardPts = g.ps.map(() => 0);
  for (const f of g.funded) {
    const vals = g.ps.map((_, p) => awardMetric(g, p, f.a));
    const best = Math.max(...vals);
    const firsts = vals.map((v, p) => (v === best ? p : -1)).filter((p) => p >= 0);
    firsts.forEach((p) => (awardPts[p]! += 5));
    if (firsts.length === 1 && g.players > 2) {
      const rest = vals.filter((v) => v < best);
      if (rest.length) {
        const second = Math.max(...rest);
        vals.forEach((v, p) => {
          if (v === second) awardPts[p]! += 2;
        });
      }
    }
  }
  return g.ps.map((x, p) => {
    const milestones = g.claimed.filter((c) => c.p === p).length * MILESTONE_VP;
    const groves = tilesOf(g, p, 'grove');
    const settlements = g.tiles.reduce(
      (n, t, s) =>
        t?.kind === 'settlement' && t.owner === p
          ? n + ADJ[s]!.filter((u) => g.tiles[u]?.kind === 'grove').length
          : n,
      0,
    );
    const cards = [...x.played, ...x.events].reduce((n, c) => n + (card(c).vp ?? 0), 0);
    const s = { tr: x.tr, milestones, awards: awardPts[p]!, groves, settlements, cards, total: 0 };
    s.total = s.tr + s.milestones + s.awards + s.groves + s.settlements + s.cards;
    return s;
  });
}

function finish(g: Shapers) {
  g.scores = scoreAll(g);
  const key = (p: number) => g.scores![p]!.total * 1000 + g.ps[p]!.res.credits;
  const best = Math.max(...g.ps.map((_, p) => key(p)));
  g.winners = g.ps.map((_, p) => p).filter((p) => key(p) === best);
  g.phase = 'over';
  g.queue = [];
  g.log.push({ k: 'end', winners: g.winners });
}

// ---------------------------------------------------------------------------------------------
// Validation

export function isValidShapers(d: unknown): d is Shapers {
  if (typeof d !== 'object' || d === null) return false;
  const g = d as Shapers;
  if (![2, 3, 4].includes(g.players)) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  if (!['setup', 'research', 'action', 'place', 'over'].includes(g.phase)) return false;
  if (
    !PARAMS.every(
      (x) => Number.isInteger(g.params?.[x]) && g.params[x] >= 0 && g.params[x] <= MAX[x],
    )
  )
    return false;
  if (!Array.isArray(g.tiles) || g.tiles.length !== POS.length) return false;
  if (
    !g.tiles.every(
      (t, s) =>
        t === null ||
        (t.kind === 'sea'
          ? BASINS.includes(s) && t.owner === -1
          : ['grove', 'settlement'].includes(t.kind) &&
            !BASINS.includes(s) &&
            Number.isInteger(t.owner) &&
            t.owner >= 0 &&
            t.owner < g.players),
    )
  )
    return false;
  if (g.tiles.filter((t) => t?.kind === 'sea').length !== g.params.sea) return false;
  const isCard = (x: unknown) =>
    Number.isInteger(x) && (x as number) >= 0 && (x as number) < CARDS.length;
  if (!Array.isArray(g.deck) || !g.deck.every(isCard)) return false;
  if (!Array.isArray(g.discard) || !g.discard.every(isCard)) return false;
  if (!Array.isArray(g.ps) || g.ps.length !== g.players) return false;
  for (const x of g.ps) {
    if (!Number.isInteger(x.corp) || x.corp < -1 || x.corp >= CORPS.length) return false;
    if (!Number.isInteger(x.tr)) return false;
    for (const r of RES) {
      if (!Number.isInteger(x.res?.[r]) || x.res[r] < 0) return false;
      if (!Number.isInteger(x.prod?.[r])) return false;
      if (r === 'credits' ? x.prod[r] < MIN_CREDIT_PROD : x.prod[r] < 0) return false;
    }
    for (const list of [x.hand, x.played, x.events, x.used, x.offer, x.options])
      if (!Array.isArray(list) || !list.every((v) => Number.isInteger(v))) return false;
    if (![...x.hand, ...x.played, ...x.events, ...x.offer].every(isCard)) return false;
  }
  // Every card is in exactly one place.
  const all = [
    ...g.deck,
    ...g.discard,
    ...g.ps.flatMap((x) => [...x.hand, ...x.played, ...x.events, ...x.offer]),
  ].sort((a, b) => a - b);
  if (all.length !== CARDS.length || !all.every((v, i) => v === i)) return false;
  if (!Array.isArray(g.corps) || g.corps.length !== CORPS.length) return false;
  if (!Array.isArray(g.pending) || (g.phase === 'place') !== g.pending.length > 0) return false;
  return (
    Array.isArray(g.log) &&
    Array.isArray(g.queue) &&
    Array.isArray(g.claimed) &&
    Array.isArray(g.funded)
  );
}
