/**
 * Hex Isles computer players. Both read only what a player at the table knows: the board, every
 * building, their own hand and charts, and the others' card counts (never their cards, the deck or
 * the dice generator).
 *
 * - Settler: values corners by the dice odds of their hexes, builds town › hut › path › chart in a
 *   fixed order, trades 4:1 / harbour surplus with the bank, sends the storm to the leader.
 * - Strategist: also weighs scarce resources on this board, picks the goal it can finish soonest
 *   for the points it brings, races for the longest trail and the grand fleet, plays its charts
 *   with purpose, and proposes and judges one-for-one trades — refusing anyone close to winning.
 */
import type { Agent } from '../../ai/agents/types';
import { RandomAgent } from '../../ai/agents/random-agent';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import {
  COST,
  GEO,
  HARBOUR_EDGES,
  RESOURCES,
  TO_WIN,
  YIELD,
  currentPlayer,
  legalActions,
  none,
  pips,
  piecesLeft,
  points,
  rate,
  siteFree,
  total,
  trailLength,
  type Action,
  type Cards,
  type IsleGame,
} from './engine';

export type Style = 'settler' | 'strategist';

/** Expected cards per roll of each resource on the board (before buildings): its scarcity. */
function supply(g: IsleGame): number[] {
  const s = [0, 0, 0, 0, 0];
  g.board.terrain.forEach((t, i) => {
    const r = YIELD[t];
    if (r >= 0) s[r]! += pips(g.board.numbers[i]!);
  });
  return s;
}

/** Resource weights: early wood and coral (paths, huts), later fish and iron (towns). */
function weights(g: IsleGame, p: number, style: Style): number[] {
  const built = g.sites.filter((s) => s?.p === p).length;
  const base = built < 3 ? [1.1, 1.1, 0.9, 1, 0.9] : [0.9, 0.9, 0.9, 1.15, 1.2];
  if (style === 'settler') return base;
  const s = supply(g);
  const mean = s.reduce((a, x) => a + x, 0) / 5;
  return base.map((w, r) => w * (0.75 + 0.25 * (mean / Math.max(1, s[r]!))));
}

/** Dice income of player p per resource (expected cards per 36 rolls). */
export function income(g: IsleGame, p: number): number[] {
  const inc = [0, 0, 0, 0, 0];
  g.sites.forEach((s, v) => {
    if (s?.p !== p) return;
    for (const h of GEO.verts[v]!.hexes) {
      const r = YIELD[g.board.terrain[h]!];
      if (r >= 0 && h !== g.storm) inc[r]! += pips(g.board.numbers[h]!) * (s.town ? 2 : 1);
    }
  });
  return inc;
}

/** How good corner v is for player p. */
export function spotValue(g: IsleGame, p: number, v: number, style: Style): number {
  const w = weights(g, p, style);
  const inc = income(g, p);
  let val = 0;
  const kinds = new Set<number>();
  for (const h of GEO.verts[v]!.hexes) {
    const r = YIELD[g.board.terrain[h]!];
    if (r < 0) continue;
    const d = pips(g.board.numbers[h]!) * (h === g.storm ? 0.4 : 1);
    val += d * w[r]!;
    if (inc[r] === 0 && !kinds.has(r)) val += style === 'strategist' ? 2.2 : 1.2;
    kinds.add(r);
  }
  HARBOUR_EDGES.forEach((e, k) => {
    const ed = GEO.edges[e]!;
    if (ed.a !== v && ed.b !== v) return;
    const kind = g.board.harbours[k]!;
    if (kind === 'any') val += 1.2;
    else {
      const r = RESOURCES.indexOf(kind);
      val += style === 'strategist' ? 0.25 * inc[r]! + 0.6 : 0.8;
    }
  });
  return val;
}

const bestBy = <T>(xs: T[], f: (x: T) => number): T | undefined => {
  let best: T | undefined;
  let bv = -Infinity;
  for (const x of xs) {
    const v = f(x);
    if (v > bv) {
      bv = v;
      best = x;
    }
  }
  return best;
};

type Goal = 'town' | 'hut' | 'path' | 'chart';

/** Cards still missing for a goal. */
const missing = (hand: Cards, goal: Goal): Cards =>
  COST[goal].map((n, i) => Math.max(0, n - hand[i]!)) as Cards;

function hutSpots(g: IsleGame, p: number) {
  return GEO.verts
    .map((_, v) => v)
    .filter((v) => siteFree(g, v) && GEO.verts[v]!.edges.some((e) => g.paths[e] === p));
}

/** The goal the player works towards now. */
function chooseGoal(g: IsleGame, p: number, style: Style): Goal {
  const left = piecesLeft(g, p);
  const hand = g.hands[p]!.hand;
  const huts = g.sites.some((s) => s?.p === p && !s.town);
  const spots = hutSpots(g, p);
  const options: Goal[] = [];
  if (huts && left.town > 0) options.push('town');
  if (left.hut > 0 && spots.length) options.push('hut');
  if (left.hut > 0 && !spots.length && left.path > 0) options.push('path');
  if (g.deck.length) options.push('chart');
  if (!options.length) return left.path > 0 ? 'path' : 'chart';
  if (style === 'settler') return options[0]!;
  // Strategist: points per expected turn to gather what is missing.
  const inc = income(g, p);
  const value: Record<Goal, number> = {
    town: 1.15,
    hut: 1 + 0.08 * (bestBy(spots, (v) => spotValue(g, p, v, style)) !== undefined ? 1 : 0),
    path: 0.75,
    chart: 0.45 + (g.hands[p]!.captains >= 1 ? 0.15 : 0),
  };
  const turns = (goal: Goal) => {
    const m = missing(hand, goal);
    let t = 0;
    m.forEach((n, r) => {
      if (n > 0) t = Math.max(t, (n * 36) / Math.max(2, inc[r]!));
    });
    // Bank trades can cover a shortfall from surplus.
    const surplus = hand.reduce((a, x, r) => a + Math.max(0, x - COST[goal][r]!), 0);
    return Math.max(0.5, t - surplus * 1.5);
  };
  return bestBy(options, (o) => value[o] / turns(o))!;
}

const ACT = (a: Action) => a;

/** One decision for player p. */
export function decide(g: IsleGame, style: Style, rng: Rng): Action {
  const p = currentPlayer(g);
  const legal = legalActions(g);
  const ph = g.phase;
  const hand = g.hands[p]!.hand;
  const pts = (q: number) => points(g, q, q === p);
  const leader = () => {
    const others = g.hands.map((_, q) => q).filter((q) => q !== p);
    return bestBy(others, (q) => pts(q) * 10 + total(g.hands[q]!.hand) * 0.1)!;
  };

  switch (ph.k) {
    case 'setup': {
      if (ph.hut === null) {
        const spots = legal.filter((a) => a.t === 'hut') as { t: 'hut'; v: number }[];
        return bestBy(spots, (a) => spotValue(g, p, a.v, style) + rng.float() * 0.01)!;
      }
      const paths = legal.filter((a) => a.t === 'path') as { t: 'path'; e: number }[];
      return bestBy(paths, (a) => {
        const { a: x, b: y } = GEO.edges[a.e]!;
        const far = x === ph.hut ? y : x;
        const next = GEO.verts[far]!.verts.filter((w) => w !== ph.hut && siteFree(g, w));
        return Math.max(0, ...next.map((w) => spotValue(g, p, w, style))) + rng.float() * 0.01;
      })!;
    }
    case 'roll': {
      const cap = legal.find((a) => a.t === 'captain');
      if (cap) {
        const blocked = GEO.hexes[g.storm]!.verts.some((v) => g.sites[v]?.p === p);
        const fleetNear =
          style === 'strategist' &&
          g.hands[p]!.captains + 1 >= 3 &&
          (g.fleet === null || g.hands[p]!.captains + 1 > g.hands[g.fleet]!.captains);
        if (blocked || fleetNear) return cap;
      }
      return { t: 'roll' };
    }
    case 'discard': {
      const goal = chooseGoal(g, p, style);
      const need = COST[goal];
      const r = bestBy(
        RESOURCES.map((_, i) => i).filter((i) => hand[i]! > 0),
        (i) => hand[i]! - need[i]! + rng.float() * 0.01,
      )!;
      const c = none();
      c[r] = 1;
      return { t: 'discard', cards: c };
    }
    case 'storm': {
      const lead = leader();
      const hexes = legal.filter((a) => a.t === 'storm') as { t: 'storm'; h: number }[];
      return bestBy(hexes, (a) => {
        let v = 0;
        for (const x of GEO.hexes[a.h]!.verts) {
          const s = g.sites[x];
          if (!s) continue;
          const d = pips(g.board.numbers[a.h] ?? null) * (s.town ? 2 : 1);
          if (s.p === p) v -= d * 3;
          else v += d * (s.p === lead ? 2 : 1) + (total(g.hands[s.p]!.hand) > 0 ? 0.5 : 0);
        }
        return v + rng.float() * 0.01;
      })!;
    }
    case 'steal': {
      const from = legal as { t: 'steal'; p: number }[];
      return bestBy(from, (a) => pts(a.p) * 10 + total(g.hands[a.p]!.hand))!;
    }
    case 'offer': {
      const accept = legal.find((a) => a.t === 'answer' && a.accept);
      if (!accept) return { t: 'answer', accept: false };
      if (style === 'strategist' && pts(ph.from) >= TO_WIN - 2)
        return { t: 'answer', accept: false };
      const goal = chooseGoal(g, p, style);
      const before = total(missing(hand, goal));
      const after = hand.map((x, i) => x - ph.get[i]! + ph.give[i]!) as Cards;
      const gain = before - total(missing(after, goal));
      const fair = total(ph.give) >= total(ph.get);
      return {
        t: 'answer',
        accept: gain > 0 || (gain === 0 && fair && total(ph.give) > total(ph.get)),
      };
    }
    case 'roadworks': {
      return pathTowards(g, p, legal, style, rng);
    }
    case 'main':
      return mainMove(g, p, legal, style, rng);
    case 'over':
      throw new Error('Game over');
  }
}

function pathTowards(g: IsleGame, p: number, legal: Action[], style: Style, rng: Rng): Action {
  const paths = legal.filter((a) => a.t === 'path') as { t: 'path'; e: number }[];
  if (!paths.length) return legal.find((a) => a.t === 'end') ?? legal[0]!;
  const targets = GEO.verts
    .map((_, v) => v)
    .filter((v) => siteFree(g, v))
    .map((v) => ({ v, val: spotValue(g, p, v, style) }));
  const trailNow = trailLength(g, p);
  return bestBy(paths, (a) => {
    const { a: x, b: y } = GEO.edges[a.e]!;
    let best = 0;
    for (const t of targets) {
      // Distance from either end of the new path to the target corner (in corners).
      const d = Math.min(cornerDist(x, t.v), cornerDist(y, t.v));
      if (d <= 2) best = Math.max(best, t.val / (1 + d));
    }
    let bonus = 0;
    if (style === 'strategist') {
      const after = { ...g, paths: g.paths.map((o, i) => (i === a.e ? p : o)) };
      const gain = trailLength(after, p) - trailNow;
      if (gain > 0 && trailNow >= 3) bonus += 1.5 * gain;
    }
    return best + bonus + rng.float() * 0.01;
  })!;
}

const DIST = (() => {
  const n = GEO.verts.length;
  const d = Array.from({ length: n }, () => Array<number>(n).fill(99));
  for (let s = 0; s < n; s++) {
    d[s]![s] = 0;
    const q = [s];
    while (q.length) {
      const v = q.shift()!;
      for (const w of GEO.verts[v]!.verts)
        if (d[s]![w] === 99) {
          d[s]![w] = d[s]![v]! + 1;
          q.push(w);
        }
    }
  }
  return d;
})();
const cornerDist = (a: number, b: number) => DIST[a]![b]!;

function mainMove(g: IsleGame, p: number, legal: Action[], style: Style, rng: Rng): Action {
  const has = (t: Action['t']) => legal.filter((a) => a.t === t);
  const hand = g.hands[p]!.hand;
  const goal = chooseGoal(g, p, style);

  // Charts first (one per turn).
  const rw = has('roadworks')[0];
  if (rw && !hutSpots(g, p).length && piecesLeft(g, p).hut > 0) return rw;
  const cap = has('captain')[0];
  if (cap) {
    const blocked = GEO.hexes[g.storm]!.verts.some((v) => g.sites[v]?.p === p);
    const fleetNear =
      g.hands[p]!.captains + 1 >= 3 &&
      (g.fleet === null || g.hands[p]!.captains + 1 > g.hands[g.fleet]!.captains);
    if (blocked || (style === 'strategist' && fleetNear)) return cap;
  }
  const need = missing(hand, goal);
  const bounty = has('bounty') as { t: 'bounty'; r: number; r2: number }[];
  if (bounty.length && total(need) > 0) {
    const order = RESOURCES.map((_, i) => i).sort((a, b) => need[b]! - need[a]!);
    const r = order[0]!;
    const r2 = need[r]! >= 2 ? r : need[order[1]!]! > 0 ? order[1]! : r;
    const pick = bounty.find((b) => b.r === Math.min(r, r2) && b.r2 === Math.max(r, r2));
    if (pick) return pick;
  }
  const emb = has('embargo') as { t: 'embargo'; r: number }[];
  if (emb.length && style === 'strategist' && total(need) > 0) {
    // The resource the others produce most of, among the ones needed.
    const others = [0, 0, 0, 0, 0];
    g.hands.forEach((_, q) => q !== p && income(g, q).forEach((x, r) => (others[r]! += x)));
    const r = bestBy(
      RESOURCES.map((_, i) => i).filter((i) => need[i]! > 0),
      (i) => others[i]!,
    );
    if (r !== undefined && others[r]! >= 8) return { t: 'embargo', r };
  }

  // Build what the goal is, when affordable.
  const towns = has('town') as { t: 'town'; v: number }[];
  if (towns.length && (goal === 'town' || style === 'settler'))
    return bestBy(towns, (a) => spotValue(g, p, a.v, style))!;
  const huts = has('hut') as { t: 'hut'; v: number }[];
  if (huts.length) return bestBy(huts, (a) => spotValue(g, p, a.v, style) + rng.float() * 0.01)!;
  if (towns.length) return bestBy(towns, (a) => spotValue(g, p, a.v, style))!;
  const paths = has('path');
  if (paths.length && (goal === 'path' || (goal === 'hut' && !hutSpots(g, p).length)))
    return pathTowards(g, p, legal, style, rng);
  if (paths.length && style === 'strategist' && goal !== 'town') {
    // Race for the longest trail when it is close.
    const mine = trailLength(g, p);
    const best = Math.max(...g.hands.map((_, q) => (q === p ? 0 : trailLength(g, q))));
    if (mine >= 3 && mine + 1 >= best && g.trail !== p) return pathTowards(g, p, legal, style, rng);
  }
  const buy = has('buy')[0];
  if (buy && (goal === 'chart' || (style === 'settler' && total(missing(hand, goal)) > 2)))
    return buy;

  // Trade with the bank towards the goal from surplus.
  if (total(need) > 0) {
    const banks = has('bank') as { t: 'bank'; give: number; get: number }[];
    const ok = banks.filter(
      (b) => need[b.get]! > 0 && hand[b.give]! - rate(g, p, b.give) >= COST[goal][b.give]!,
    );
    if (ok.length) return bestBy(ok, (b) => hand[b.give]! - COST[goal][b.give]! + need[b.get]!)!;
    if (style === 'strategist' && g.offers < 2) {
      const offer = proposeTrade(g, p, goal);
      if (offer) return offer;
    }
  }
  if (buy && style === 'strategist' && total(hand) > 7) return buy;
  if (paths.length && total(hand) > 7 && piecesLeft(g, p).path > 0)
    return pathTowards(g, p, legal, style, rng);
  return ACT({ t: 'end' });
}

/** A one-for-one offer: a surplus card for a needed one, to the player furthest from winning. */
function proposeTrade(g: IsleGame, p: number, goal: Goal): Action | null {
  const hand = g.hands[p]!.hand;
  const need = missing(hand, goal);
  const want = RESOURCES.map((_, i) => i).find((i) => need[i]! > 0);
  const give = bestBy(
    RESOURCES.map((_, i) => i).filter((i) => hand[i]! - COST[goal][i]! > 0),
    (i) => hand[i]! - COST[goal][i]!,
  );
  if (want === undefined || give === undefined) return null;
  // Players who already turned an offer down this turn are not asked again.
  const refused = new Set(
    g.log
      .filter((e) => e.k === 'offer')
      .slice(-g.offers)
      .filter((e) => e.k === 'offer' && !e.ok && g.offers > 0)
      .map((e) => (e.k === 'offer' ? e.to : -1)),
  );
  const others = g.hands
    .map((_, q) => q)
    .filter((q) => q !== p && !refused.has(q) && total(g.hands[q]!.hand) > 0)
    .sort((a, b) => points(g, a, false) - points(g, b, false));
  const to = others.find((q) => income(g, q)[want]! > 0) ?? others[0];
  if (to === undefined) return null;
  const a = none();
  a[give] = 1;
  const b = none();
  b[want] = 1;
  return { t: 'offer', to, give: a, get: b };
}

class IsleAgent implements Agent<IsleGame, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<IsleGame, Action>, g: IsleGame, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<IsleGame, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'settler',
    kind: 'heuristic',
    label: { en: 'Settler', es: 'Colono' },
    description: {
      en: 'Settles the best-numbered corners and builds in a fixed order, trading surplus with the bank.',
      es: 'Ocupa las esquinas con mejores números y construye en un orden fijo, cambiando lo que sobra con la banca.',
    },
    create: () => new IsleAgent('settler', 'Settler', 'settler'),
  },
  {
    id: 'strategist',
    kind: 'heuristic',
    label: { en: 'Strategist', es: 'Estratega' },
    description: {
      en: 'Weighs scarce resources, chases the quickest points, races for the trail and the fleet, and trades with the other players.',
      es: 'Valora los recursos escasos, busca los puntos más rápidos, compite por la ruta y la flota y comercia con los demás.',
    },
    create: () => new IsleAgent('strategist', 'Strategist', 'strategist'),
  },
];
