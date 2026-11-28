/**
 * Planet Shapers computer players. They read the board and their own hand; never the deck order
 * or another player's hand.
 *
 * - Cadet: values every action in credits (production for five generations, points at 5 credits,
 *   parameter steps as a point plus income, money it is piling up at less), takes the best one
 *   it can afford, converts flora and heat, claims milestones and buys the cards it values above
 *   their price.
 * - Architect: estimates how many generations are left from the pace of shaping, ranks its
 *   actions with that (so production counts early and points late, and it funds awards it leads),
 *   then tries its four best actions and passing in three imagined games each — the deck and the
 *   other players' hands reshuffled, since it cannot know them — played to the end by cadets, and
 *   takes the action with the best final margin over the strongest rival.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import {
  act,
  awardMetric,
  card,
  costOf,
  currentPlayer,
  groveCost,
  heatCost,
  legalActions,
  meetsReq,
  researchPrice,
  scoreAll,
  type Action,
  type Shapers,
} from './engine';
import {
  ADJ,
  AWARD_COSTS,
  BASINS,
  BONUS,
  CARD_BONUS,
  CORPS,
  HEAT_PROD_STEPS,
  HEAT_SEA_STEP,
  MAX,
  MAX_GEN,
  MILESTONE_VP,
  PARAMS,
  RES,
  STD,
  type Amounts,
  type CardDef,
  type Param,
  type Res,
} from './world';

export type Style = 'cadet' | 'architect';

interface Model {
  /** Generations left, this one included. */
  L: number;
  /** Credits per point. */
  V: number;
  /** What a credit spent now is worth: money piling up (or left at the end) is worth less. */
  money: number;
  res: Record<Res, number>;
}

function model(g: Shapers, p: number, style: Style): Model {
  const corp = CORPS[g.ps[p]!.corp]?.id;
  const total = PARAMS.reduce((n, x) => n + MAX[x], 0);
  const left = PARAMS.reduce((n, x) => n + MAX[x] - g.params[x], 0);
  let L = 5;
  let V = 5;
  if (style === 'architect') {
    const done = total - left;
    const pace = g.gen > 1 ? Math.max(2, done / (g.gen - 1)) : 1.5 + 1.4 * g.players;
    L = Math.max(1, Math.min(MAX_GEN - g.gen + 1, Math.ceil(left / pace)));
    V = L <= 2 ? 7 : 5.5;
  }
  const heatOpen = g.params.heat < MAX.heat;
  const cash = g.ps[p]!.res.credits;
  const money =
    style === 'architect'
      ? L <= 1
        ? 0.15
        : cash > 40
          ? 0.6
          : cash > 25
            ? 0.75
            : 0.9
      : cash > 30
        ? 0.6
        : 0.9;
  return {
    L,
    V,
    money,
    res: {
      credits: 1,
      ore: corp === 'forgeline' ? 2.7 : 1.8,
      crystal: corp === 'skyreach' ? 3.6 : 2.7,
      flora: (V + (g.params.air < MAX.air ? V + L : 0) + 1) / (corp === 'verdance' ? 7 : 8),
      power: 1.1,
      heat: heatOpen ? (V + L) / (corp === 'thermos' ? 7 : 8) : 0.05,
    },
  };
}

const amounts = (m: Model, a: Amounts | undefined) =>
  a ? RES.reduce((n, r) => n + (a[r] ?? 0) * m.res[r], 0) : 0;
/** Production lasts L production phases, but the last generation's production is worth little. */
const prodWorth = (m: Model, a: Amounts | undefined) =>
  a
    ? RES.reduce(
        (n, r) => n + (a[r] ?? 0) * (r === 'credits' ? 1 : m.res[r]) * Math.max(0, m.L - 0.6),
        0,
      )
    : 0;
const stepWorth = (g: Shapers, m: Model, param: Param, n: number) => {
  const room = Math.max(0, MAX[param] - g.params[param]);
  const steps = Math.min(n, room);
  let v = steps * (m.V + m.L);
  if (param === 'sea') v += steps * 3;
  if (param === 'heat') {
    for (let k = 1; k <= steps; k++) {
      const to = g.params.heat + k;
      if (HEAT_PROD_STEPS.includes(to)) v += m.L;
      if (to === HEAT_SEA_STEP) v += m.V + m.L;
    }
  }
  return v;
};

function cardWorth(g: Shapers, p: number, d: CardDef, m: Model, style: Style) {
  let v = amounts(m, d.gain) + prodWorth(m, d.prod);
  for (const param of PARAMS) if (d.raise?.[param]) v += stepWorth(g, m, param, d.raise[param]!);
  if (d.tr) v += d.tr * (m.V + m.L);
  if (d.draw) v += d.draw * 3;
  if (d.vp) v += d.vp * m.V;
  for (const t of d.tiles ?? [])
    v +=
      t === 'grove' ? m.V + stepWorth(g, m, 'air', 1) + 2 : 2 + Math.min(3, m.L * 0.4) * m.V * 0.5;
  if (d.action) {
    const a = d.action;
    let per = amounts(m, a.gain) - amounts(m, a.pay) + (a.draw ?? 0) * 3;
    for (const param of PARAMS)
      if (a.raise?.[param]) per += stepWorth(g, m, param, a.raise[param]!) / Math.max(1, m.L);
    v += Math.max(0, per) * Math.max(0, m.L - 0.5) * 0.8;
  }
  if (d.effect?.discount)
    v += d.effect.discount.n * Math.max(0, m.L - 1) * (d.effect.discount.tag ? 0.9 : 1.8);
  if (d.effect?.onTag) v += amounts(m, d.effect.onTag.gain) * Math.max(0, m.L - 1) * 0.6;
  // Tags that help this player (corporation rates, own effects).
  for (const c of g.ps[p]!.played) {
    const on = card(c).effect?.onTag;
    if (on && d.tags.includes(on.tag)) v += amounts(m, on.gain);
  }
  if (style === 'architect' && d.tags.includes('build')) v += 0.4;
  return v;
}

/** Credits value of paying for card i (ore and crystal valued as what they are worth). */
function payCost(g: Shapers, p: number, i: number, m: Model) {
  const d = card(i);
  const me = g.ps[p]!;
  let left = costOf(g, p, i);
  const corp = CORPS[me.corp]?.id;
  let v = 0;
  const units = (have: number, unit: number, worth: number) => {
    const k = Math.min(have, Math.floor(left / unit));
    left -= k * unit;
    v += k * worth;
  };
  if (d.tags.includes('space')) units(me.res.crystal, corp === 'skyreach' ? 4 : 3, m.res.crystal);
  if (d.tags.includes('build')) units(me.res.ore, corp === 'forgeline' ? 3 : 2, m.res.ore);
  return v + left;
}

function tileWorth(
  g: Shapers,
  p: number,
  kind: 'sea' | 'grove' | 'settlement',
  s: number,
  m: Model,
) {
  let v = amounts(m, BONUS[s]) + (CARD_BONUS.has(s) ? 3 : 0);
  v += 2 * ADJ[s]!.filter((t) => g.tiles[t]?.kind === 'sea').length;
  if (kind === 'grove') {
    for (const t of ADJ[s]!) {
      const x = g.tiles[t];
      if (x?.kind === 'settlement') v += x.owner === p ? m.V : -m.V * 0.6;
    }
  }
  if (kind === 'settlement') {
    for (const t of ADJ[s]!) {
      const x = g.tiles[t];
      if (x?.kind === 'grove') v += m.V;
      else if (!x && !BASINS.includes(t)) v += 0.8;
    }
  }
  return v;
}

function actionWorth(g: Shapers, p: number, a: Action, m: Model, style: Style): number {
  const me = g.ps[p]!;
  switch (a.t) {
    case 'play':
      return cardWorth(g, p, card(a.card), m, style) - payCost(g, p, a.card, m) * m.money;
    case 'std': {
      const cost = STD.find((s) => s.id === a.id)!.cost;
      const rebate = CORPS[me.corp]?.id === 'meridian' && cost >= 20 ? 4 : 0;
      const gain =
        a.id === 'power'
          ? prodWorth(m, { power: 1 })
          : a.id === 'heater'
            ? stepWorth(g, m, 'heat', 1)
            : a.id === 'aquifer'
              ? stepWorth(g, m, 'sea', 1) + 2
              : a.id === 'grove'
                ? m.V + stepWorth(g, m, 'air', 1) + 2
                : prodWorth(m, { credits: 1 }) + 2 + Math.min(3, m.L * 0.4) * m.V * 0.5;
      return gain - (cost - rebate) * m.money;
    }
    case 'convert':
      return a.what === 'flora'
        ? m.V + stepWorth(g, m, 'air', 1) + 2 - groveCost(g, p) * 0.3
        : stepWorth(g, m, 'heat', 1) - heatCost(g, p) * 0.2;
    case 'use': {
      const ac = card(a.card).action!;
      let v = amounts(m, ac.gain) - amounts(m, ac.pay) + (ac.draw ?? 0) * 3;
      for (const param of PARAMS)
        if (ac.raise?.[param]) v += stepWorth(g, m, param, ac.raise[param]!);
      return v;
    }
    case 'claim':
      return MILESTONE_VP * m.V - 8 * m.money;
    case 'fund': {
      if (style !== 'architect') return -1;
      const mine = awardMetric(g, p, a.a);
      const best = Math.max(...g.ps.map((_, q) => (q === p ? -Infinity : awardMetric(g, q, a.a))));
      const lead = mine - best;
      if (lead <= 0 || m.L > 3) return -1;
      return (lead >= 2 ? 5 : 3) * m.V - AWARD_COSTS[g.funded.length]! * m.money;
    }
    case 'sell':
      return m.L <= 1 ? 1 - cardWorth(g, p, card(a.card), m, style) * 0.1 - 0.5 : -1;
    default:
      return 0;
  }
}

/** Buys every offered card worth more than its price (requirements not met yet count against it). */
function buyChoice(g: Shapers, p: number, legal: Action[]): Action {
  const me = g.ps[p]!;
  const m = model(g, p, 'cadet');
  const price = researchPrice(g, p);
  const scored = me.offer.map((i, k) => {
    let v = cardWorth(g, p, card(i), m, 'cadet') - costOf(g, p, i);
    if (!meetsReq(g, p, i)) v -= 3;
    return { k, v };
  });
  scored.sort((a, b) => b.v - a.v);
  let mask = 0;
  let spent = 0;
  for (const s of scored)
    if (s.v > price && spent + price <= me.res.credits) {
      mask |= 1 << s.k;
      spent += price;
    }
  return legal.some((x) => x.t === 'buy' && x.mask === mask)
    ? { t: 'buy', mask }
    : { t: 'buy', mask: 0 };
}

function corpChoice(g: Shapers, p: number, style: Style): Action {
  const me = g.ps[p]!;
  const m = model(g, p, style);
  const score = (c: number) => {
    const corp = CORPS[c]!;
    let v = corp.credits + prodWorth({ ...m, L: 7 }, corp.prod);
    if (style === 'architect') {
      const tags = me.offer.flatMap((i) => card(i).tags);
      const n = (t: string) => tags.filter((x) => x === t).length;
      if (corp.id === 'forgeline') v += n('build') * 1.5;
      if (corp.id === 'skyreach') v += n('space') * 1.5;
      if (corp.id === 'verdance') v += n('plant') * 1.5;
      if (corp.id === 'archive') v += 6;
    }
    return v;
  };
  return { t: 'corp', i: score(me.options[0]!) >= score(me.options[1]!) ? 0 : 1 };
}

function placeChoice(g: Shapers, p: number, style: Style, legal: Action[]): Action {
  const m = model(g, p, style);
  const kind = g.pending[0]!.kind;
  let best = legal[0]!;
  let bv = -Infinity;
  for (const a of legal) {
    if (a.t !== 'tile') continue;
    const v = tileWorth(g, p, kind, a.space, m);
    if (v > bv) {
      bv = v;
      best = a;
    }
  }
  return best;
}

function heuristic(g: Shapers, style: Style, rng: Rng): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  const p = currentPlayer(g);
  if (legal[0]!.t === 'corp') return corpChoice(g, p, style);
  if (legal[0]!.t === 'buy') return buyChoice(g, p, legal);
  if (g.phase === 'place') return placeChoice(g, p, style, legal);
  return ranked(g, p, style, legal, rng)[0]!.a;
}

function ranked(g: Shapers, p: number, style: Style, legal: Action[], rng: Rng) {
  const m = model(g, p, style);
  const out = legal.map((a) => ({
    a,
    v: a.t === 'pass' ? 0.5 : actionWorth(g, p, a, m, style) + rng.float() * 0.01,
  }));
  return out.sort((x, y) => y.v - x.v);
}

/**
 * A world p could be in: the deck, the other players' hands and offers are shuffled together and
 * dealt back in the same sizes, and the generator is reseeded (p never sees the real order).
 */
function determinize(g: Shapers, p: number, rng: Rng): Shapers {
  const w = structuredClone(g);
  const pool = [...w.deck];
  w.ps.forEach((x, q) => {
    if (q !== p) pool.push(...x.hand, ...x.offer);
  });
  const mixed = rng.shuffle(pool);
  w.ps.forEach((x, q) => {
    if (q === p) return;
    x.hand = mixed.splice(0, x.hand.length);
    x.offer = mixed.splice(0, x.offer.length);
  });
  w.deck = mixed;
  w.rng = new Rng(rng.uint32()).state;
  return w;
}

/** Plays a world to the end with cadets everywhere; p's margin over the best other player. */
function rollout(w: Shapers, p: number, rng: Rng) {
  let g = w;
  for (let k = 0; k < 4000 && g.phase !== 'over'; k++) g = act(g, heuristic(g, 'cadet', rng));
  const scores = g.scores ?? scoreAll(g);
  const mine = scores[p]!.total;
  const best = Math.max(...scores.map((s, q) => (q === p ? -Infinity : s.total)));
  return mine - best + g.ps[p]!.res.credits * 0.01;
}

const CANDIDATES = 4;
const ROLLOUTS = 3;

export function decide(g: Shapers, style: Style, rng: Rng): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  if (style === 'cadet' || g.phase !== 'action') return heuristic(g, style, rng);
  const p = currentPlayer(g);
  const top = ranked(g, p, style, legal, rng);
  const cands = top
    .filter((x) => x.a.t !== 'pass')
    .slice(0, CANDIDATES)
    .map((x) => x.a);
  cands.push({ t: 'pass' });
  let best = cands[0]!;
  let bv = -Infinity;
  for (const a of cands) {
    let sum = 0;
    for (let k = 0; k < ROLLOUTS; k++) sum += rollout(act(determinize(g, p, rng), a), p, rng);
    if (sum > bv) {
      bv = sum;
      best = a;
    }
  }
  return best;
}

class ShaperAgent implements Agent<Shapers, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Shapers, Action>, g: Shapers, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Shapers, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'cadet',
    kind: 'heuristic',
    label: { en: 'Cadet', es: 'Cadete' },
    description: {
      en: 'Plays the best card or project it can afford by a simple value count, converts flora and heat, claims milestones.',
      es: 'Juega la mejor carta o proyecto que puede pagar según un recuento sencillo, convierte flora y calor, reclama hitos.',
    },
    create: () => new ShaperAgent('cadet', 'Cadet', 'cadet'),
  },
  {
    id: 'architect',
    kind: 'heuristic',
    label: { en: 'Architect', es: 'Arquitecto' },
    description: {
      en: 'Judges how long the game will last, so production counts early and points late; funds awards it leads, keeps cash for its plays and places tiles for the most points.',
      es: 'Calcula cuánto durará la partida —la producción cuenta al principio y los puntos al final—, financia premios que lidera, guarda dinero para sus jugadas y coloca losetas para sumar más.',
    },
    create: () => new ShaperAgent('architect', 'Architect', 'architect'),
  },
];
