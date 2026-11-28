/**
 * Land Baron computer players. They see the board, everyone's cash and holdings (all public) and
 * nothing else — not the dice generator or the card order.
 *
 * - Speculator: buys whatever it can afford above a small reserve, bids up to list price, builds on
 *   any full district, mortgages its cheapest lots when short, takes trades that hand it a district.
 * - Baron: values each space by how often it is landed on (a Markov chain over the board with its
 *   dice, cards and the arrest corner) times the rent it can earn; keeps a cash reserve sized to
 *   the worst rent it could face, builds to three houses first, bids and trades by those values,
 *   sits in the Lockup late in the game, and never hands a rival a full district for less than it
 *   gains.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import {
  COUNCIL,
  FERRIES,
  GROUP_LOTS,
  LOCKUP,
  LUCK,
  SIZE,
  SPACES,
  WORKS,
  type CardEffect,
} from './board';
import {
  canBuild,
  canMortgage,
  canRedeem,
  canSell,
  currentPlayer,
  holdings,
  houseCost,
  legalActions,
  offerOk,
  ownsGroup,
  price,
  redeemCost,
  rentFor,
  tradable,
  type Action,
  type Baron,
} from './engine';

export type Style = 'speculator' | 'baron';

/* ---------- landing frequencies ---------- */

const DICE = Array.from({ length: 13 }, (_, s) => (s < 2 ? 0 : (6 - Math.abs(7 - s)) / 36));
function resolve(k: number): Map<number, number> {
  const out = new Map<number, number>();
  const add = (to: number, p: number) => out.set(to, (out.get(to) ?? 0) + p);
  const sp = SPACES[k]!;
  if (sp.kind === 'arrest') return new Map([[LOCKUP, 1]]);
  if (sp.kind !== 'luck' && sp.kind !== 'council') return new Map([[k, 1]]);
  const deck = sp.kind === 'luck' ? LUCK : COUNCIL;
  for (const c of deck) {
    const e: CardEffect = c.effect;
    const p = 1 / deck.length;
    if (e.k === 'move') add(e.to, p);
    else if (e.k === 'back') add((k - e.n + SIZE) % SIZE, p);
    else if (e.k === 'nearest') {
      const list = e.kind === 'ferry' ? FERRIES : WORKS;
      add(list.find((s) => s > k) ?? list[0]!, p);
    } else if (e.k === 'lockup') add(LOCKUP, p);
    else add(k, p);
  }
  return out;
}
/** Long-run share of turns ending on each space. */
export const LANDING: number[] = (() => {
  let v = Array<number>(SIZE).fill(1 / SIZE);
  const res = SPACES.map((_, k) => resolve(k));
  for (let it = 0; it < 200; it++) {
    const n = Array<number>(SIZE).fill(0);
    v.forEach((pv, i) => {
      for (let s = 2; s <= 12; s++)
        for (const [to, pr] of res[(i + s) % SIZE]!) n[to]! += pv * DICE[s]! * pr;
    });
    v = n;
  }
  return v;
})();

/* ---------- valuation ---------- */

/** Expected rent per opponent turn of space `at` at a given building level (houses 0–5). */
function earning(at: number, level: number): number {
  const sp = SPACES[at]!;
  const f = LANDING[at]!;
  if (sp.kind === 'lot') return f * (level === 0 ? sp.rent![0]! * 2 : sp.rent![level]!);
  if (sp.kind === 'ferry') return f * 60;
  if (sp.kind === 'works') return f * 7 * 6;
  return 0;
}

/** What space `at` is worth to player p (in cash), counting district completion. */
export function value(g: Baron, p: number, at: number): number {
  const sp = SPACES[at]!;
  const base = price(at);
  if (sp.kind !== 'lot') {
    const mine = (sp.kind === 'ferry' ? FERRIES : WORKS).filter((s) => g.owner[s] === p).length;
    return base * (1 + 0.15 * mine);
  }
  const lots = GROUP_LOTS[sp.group!]!;
  const mine = lots.filter((s) => s === at || g.owner[s] === p).length;
  const rivals = new Set(lots.map((s) => g.owner[s]).filter((o) => o !== null && o !== p));
  const completes = mine === lots.length;
  let v = base;
  if (completes) v += earning(at, 3) * 60 * lots.length * 0.5;
  else if (rivals.size === 0) v += base * 0.25 * mine;
  // Blocking a rival who holds the rest of the district.
  const blocks =
    lots.every((s) => s === at || (g.owner[s] !== null && g.owner[s] !== p)) && rivals.size === 1;
  if (blocks) v += base * 0.6;
  return v;
}

/** The worst rent p might face on a rival's space in one move, for the cash reserve. */
function exposure(g: Baron, p: number): number {
  let worst = 0;
  for (let s = 2; s <= 12; s++) {
    const at = (g.pos[p]! + s) % SIZE;
    const o = g.owner[at];
    if (o !== null && o !== undefined && o !== p) worst = Math.max(worst, rentFor(g, at, s));
  }
  return worst;
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

/** The asset to give up first when cash is needed: mortgage idle lots, sell houses last. */
function raise(g: Baron, p: number, style: Style): Action | null {
  const mort = holdings(g, p).filter((s) => canMortgage(g, p, s));
  if (mort.length)
    return {
      t: 'mortgage',
      at: bestBy(mort, (s) => -(style === 'baron' ? value(g, p, s) : price(s)))!,
    };
  const sell = holdings(g, p).filter((s) => canSell(g, p, s));
  if (sell.length) return { t: 'sell', at: bestBy(sell, (s) => -earning(s, g.houses[s]!))! };
  return null;
}

export function decide(g: Baron, style: Style, rng: Rng): Action {
  const p = currentPlayer(g);
  const ph = g.phase;
  const legal = legalActions(g);
  const cash = g.cash[p]!;
  const reserve = style === 'baron' ? Math.max(100, exposure(g, p) * 0.6) : 100;
  const late = g.round > 15 || g.houses.some((h, s) => h >= 3 && g.owner[s] !== p);
  const jitter = () => rng.float() * 0.001;

  switch (ph.k) {
    case 'over':
      throw new Error('Game over');
    case 'debt': {
      const r = raise(g, p, style);
      return r ?? legal[0]!;
    }
    case 'roll': {
      if (g.lockup[p]! >= 0) {
        const stay = style === 'baron' && late;
        if (!stay && legal.some((a) => a.t === 'pardon')) return { t: 'pardon' };
        if (!stay && cash >= 50 + reserve && legal.some((a) => a.t === 'bail'))
          return { t: 'bail' };
      }
      return { t: 'roll' };
    }
    case 'buy': {
      const v = style === 'baron' ? value(g, p, ph.at) : price(ph.at);
      const can = legal.some((a) => a.t === 'buy');
      const keep = style === 'baron' ? reserve * (v > price(ph.at) * 1.4 ? 0.3 : 1) : 50;
      if (can && cash - price(ph.at) >= keep) return { t: 'buy' };
      // Worth mortgaging a lot for when it completes a district (never one of a full district).
      if (style === 'baron' && v > price(ph.at) * 1.8 && !can) {
        const r = raise(g, p, style);
        if (r?.t === 'mortgage') {
          const group = SPACES[r.at]!.group;
          if (group === undefined || !ownsGroup(g, p, group)) return r;
        }
      }
      return { t: 'decline' };
    }
    case 'auction': {
      const v = style === 'baron' ? value(g, p, ph.at) : price(ph.at);
      const limit = Math.min(v, cash - (style === 'baron' ? reserve * 0.5 : 30));
      const bids = legal.filter((a) => a.t === 'bid') as { t: 'bid'; n: number }[];
      const ok = bids.filter((b) => b.n <= limit);
      if (!ok.length || ph.high === p) return { t: 'pass' };
      return ok.reduce((a, b) => (a.n < b.n ? a : b));
    }
    case 'offer': {
      const accept = legal.find((a) => a.t === 'answer' && a.accept);
      if (!accept) return { t: 'answer', accept: false };
      // Value change for us (the receiver): we get ph.give and cash, we give ph.get.
      const gain = ph.give.reduce((a, s) => a + value(g, p, s), 0) + ph.cash;
      const loss = ph.get.reduce(
        (a, s) => a + (style === 'baron' ? value(g, ph.from, s) : price(s)),
        0,
      );
      return { t: 'answer', accept: gain > loss * (style === 'baron' ? 1.05 : 1) };
    }
    case 'main': {
      const build = holdings(g, p).filter((s) => canBuild(g, p, s));
      if (build.length) {
        const s = bestBy(build, (x) =>
          style === 'baron'
            ? (earning(x, g.houses[x]! + 1) - earning(x, g.houses[x]!)) / houseCost(x) +
              (g.houses[x]! < 3 ? 1 : 0) +
              jitter()
            : -g.houses[x]! + jitter(),
        )!;
        if (cash - houseCost(s) >= reserve) return { t: 'build', at: s };
      }
      const redeem = holdings(g, p).filter((s) => canRedeem(g, p, s));
      if (redeem.length) {
        const s = bestBy(redeem, (x) => value(g, p, x) - redeemCost(x))!;
        if (cash - redeemCost(s) >= reserve * 2 + 200) return { t: 'redeem', at: s };
      }
      // Ask a rival for the last lot of a district.
      if (style === 'baron' && g.offers < 1) {
        const offer = proposeBuy(g, p, reserve);
        if (offer) return offer;
      }
      return { t: 'end' };
    }
  }
}

/** The baron asks a rival for the lot that completes one of its districts, for cash. */
function proposeBuy(g: Baron, p: number, reserve: number): Action | null {
  for (const lots of GROUP_LOTS) {
    const missing = lots.filter((s) => g.owner[s] !== p);
    if (missing.length !== 1) continue;
    const s = missing[0]!;
    const o = g.owner[s];
    if (o === null || o === undefined || !tradable(g, o, s)) continue;
    for (const k of [1, 1.5, 2]) {
      const cash = Math.round(price(s) * k);
      if (g.cash[p]! - cash < reserve) break;
      if (cash > value(g, o, s) * 1.05 && offerOk(g, o, [], [s], cash))
        return { t: 'offer', to: o, give: [], get: [s], cash };
    }
    // Offer the most we can and let them decide.
    const cash = Math.round(price(s) * 2);
    if (g.cash[p]! - cash >= reserve && offerOk(g, o, [], [s], cash))
      return { t: 'offer', to: o, give: [], get: [s], cash };
  }
  return null;
}

class BaronAgent implements Agent<Baron, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Baron, Action>, g: Baron, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Baron, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'speculator',
    kind: 'heuristic',
    label: { en: 'Speculator', es: 'Especulador' },
    description: {
      en: 'Buys what it can afford, builds on any full district and mortgages when short.',
      es: 'Compra lo que puede pagar, construye en cualquier barrio completo e hipoteca si le falta dinero.',
    },
    create: () => new BaronAgent('speculator', 'Speculator', 'speculator'),
  },
  {
    id: 'baron',
    kind: 'heuristic',
    label: { en: 'Baron', es: 'Barón' },
    description: {
      en: 'Values every space by how often it is landed on, keeps a reserve against the worst rent, builds to three houses and trades for full districts.',
      es: 'Valora cada casilla por lo a menudo que se cae en ella, guarda reservas para la peor renta, construye hasta tres casas y negocia barrios completos.',
    },
    create: () => new BaronAgent('baron', 'Baron', 'baron'),
  },
];
