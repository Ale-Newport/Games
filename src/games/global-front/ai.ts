/**
 * Global Front computer players. They play one alliance (both its powers) and see the whole board,
 * which is public; never the dice generator. Every decision is one action, recomputed from the
 * board, so a turn is built step by step.
 *
 * - Colonel: buys mostly infantry with some armour, attacks a neighbour when its strength is at
 *   least 1.6 times the defence, retreats when outmatched, and walks spare units to the front.
 * - General: estimates each battle by simulating it (60 rolls of the real combat rules), attacks
 *   where it wins at least 70 % of the time for the territory's worth and commits until it does,
 *   lands troops by sea on weak coasts, retreats when its odds fall under 30 %, sends spare units
 *   to the front under most threat and places new units at the factory nearest the fighting.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import {
  allied,
  canMove,
  canSail,
  enemyOf,
  hostile,
  legalActions,
  placeSpots,
  type Action,
  type Front,
  type Unit,
} from './engine';
import { isSea, LOCS, unitType, type UnitKind } from './world';

export type Style = 'colonel' | 'general';

const power = (u: Unit, attack: boolean) =>
  attack ? unitType(u.kind).attack : unitType(u.kind).defense;
/** Combat strength of a group (artillery lifting infantry). */
function strength(units: Unit[], attack: boolean): number {
  let s = units.reduce((a, u) => a + power(u, attack), 0);
  if (attack)
    s += Math.min(
      units.filter((u) => u.kind === 'infantry').length,
      units.filter((u) => u.kind === 'artillery').length,
    );
  return s;
}

/** Win chance of attackers against defenders, by simulating the combat rules. */
export function winChance(att: Unit[], def: Unit[], sims = 60, seed = 1): number {
  if (!def.length) return 1;
  if (!att.length) return 0;
  const rng = new Rng(seed);
  let wins = 0;
  const order = (us: { k: UnitKind; hp: number }[]) =>
    us.sort((a, b) => unitType(a.k).cost - unitType(b.k).cost);
  for (let s = 0; s < sims; s++) {
    let A = order(att.map((u) => ({ k: u.kind, hp: unitType(u.kind).hp - u.hits })));
    let D = order(def.map((u) => ({ k: u.kind, hp: unitType(u.kind).hp - u.hits })));
    for (let round = 0; round < 20 && A.length && D.length; round++) {
      let sup = A.filter((u) => u.k === 'artillery').length;
      let ah = 0;
      for (const u of A) {
        let v = unitType(u.k).attack;
        if (u.k === 'infantry' && sup > 0) {
          sup--;
          v = 2;
        }
        if (v > 0 && rng.range(1, 6) <= v) ah++;
      }
      let dh = 0;
      for (const u of D)
        if (unitType(u.k).defense > 0 && rng.range(1, 6) <= unitType(u.k).defense) dh++;
      const hit = (side: typeof A, n: number) => {
        for (let k = 0; k < n && side.length; k++) {
          const bs = side.find((u) => u.k === 'battleship' && u.hp === 2);
          if (bs) bs.hp = 1;
          else side.shift();
        }
      };
      hit(D, ah);
      hit(A, dh);
      A = A.filter((u) => u.hp > 0);
      D = D.filter((u) => u.hp > 0);
      if (
        D.length &&
        D.every((u) => u.k === 'transport') &&
        A.some((u) => unitType(u.k).attack > 0)
      )
        D = [];
    }
    if (A.length && !D.length) wins++;
  }
  return wins / sims;
}

const enemiesAt = (g: Front, p: number, loc: number) =>
  g.units.filter((u) => u.loc === loc && !allied(p, u.owner));
const mineAt = (g: Front, loc: number) =>
  g.units.filter((u) => u.loc === loc && u.owner === g.power);

/** Enemy attack strength that could reach loc on their next turns (adjacent land, armour at 2, air). */
function threat(g: Front, loc: number): number {
  const p = g.power;
  let s = 0;
  for (const u of g.units) {
    if (allied(p, u.owner)) continue;
    const t = unitType(u.kind);
    const d = hops(
      u.loc,
      loc,
      t.domain === 'land' ? (l) => !isSea(l) : t.domain === 'sea' ? isSea : () => true,
      t.move,
    );
    if (d <= t.move && t.domain !== 'sea') s += t.attack;
  }
  return s;
}
function hops(from: number, to: number, pass: (l: number) => boolean, limit: number): number {
  if (from === to) return 0;
  const seen = new Map([[from, 0]]);
  const q = [from];
  while (q.length) {
    const v = q.shift()!;
    const d = seen.get(v)!;
    if (d >= limit) continue;
    for (const w of LOCS[v]!.adj) {
      if (seen.has(w)) continue;
      if (w === to) return d + 1;
      seen.set(w, d + 1);
      if (pass(w)) q.push(w);
    }
  }
  return 99;
}

/** Worth of taking a place: its value, a victory city, a capital; enemy fleets by their cost. */
function worth(g: Front, loc: number): number {
  const l = LOCS[loc]!;
  if (isSea(loc))
    return enemiesAt(g, g.power, loc).reduce((a, u) => a + unitType(u.kind).cost, 0) / 6;
  return l.value + (l.city ? 4 : 0) + (l.capital && g.owner[loc] === LOCS[loc]!.owner ? 10 : 0);
}

/** Units of the power that could still join an attack on loc. */
function reachers(g: Front, loc: number): Unit[] {
  return g.units.filter((u) => u.owner === g.power && !u.fought && canMove(g, u, loc));
}

/** The garrison a place keeps: one land unit where enemies are next door. */
function keep(g: Front, u: Unit, style: Style): boolean {
  void style;
  const here = mineAt(g, u.loc).filter((x) => unitType(x.kind).domain === 'land');
  if (unitType(u.kind).domain !== 'land') return false;
  // Leave one land unit behind where enemies are next door.
  return here.length <= 1 && LOCS[u.loc]!.adj.some((a) => enemiesAt(g, g.power, a).length > 0);
}

/**
 * Purchases: infantry with armour every third unit. (A plan with transports, fighters and a
 * capital guard sized to the threat was measured and lost more games — the threat estimate is too
 * cautious — so both players buy this way.)
 */
function buyPlan(g: Front): UnitKind[] {
  let cash = g.treasury[g.power]!;
  const plan: UnitKind[] = [];
  for (let i = 0; cash >= 3; i++) {
    const k: UnitKind = i % 3 === 2 && cash >= 6 ? 'armor' : 'infantry';
    plan.push(k);
    cash -= unitType(k).cost;
  }
  return plan;
}

/** The attacks worth making now, best first. */
function targets(g: Front, style: Style): { loc: number; need: number }[] {
  const p = g.power;
  const out: { loc: number; score: number; need: number }[] = [];
  for (let loc = 0; loc < LOCS.length; loc++) {
    if (!hostile(g, p, loc)) continue;
    const def = enemiesAt(g, p, loc);
    const committed = mineAt(g, loc).filter((u) => u.fought);
    const avail = reachers(g, loc).filter((u) => !keep(g, u, style));
    const all = [...committed, ...avail];
    if (!all.some((u) => unitType(u.kind).domain === 'land') && !isSea(loc) && def.length === 0)
      continue;
    if (isSea(loc) && !def.length) continue;
    if (!isSea(loc) && !all.some((u) => unitType(u.kind).domain === 'land')) continue;
    if (style === 'colonel') {
      const ratio = strength(all, true) / Math.max(1, strength(def, false));
      if (ratio < 1.6) continue;
      out.push({ loc, score: worth(g, loc) + ratio, need: strength(def, false) * 1.6 });
    } else {
      const chance = winChance(all, def, 60, loc + g.round * 97);
      if (chance < 0.7) continue;
      out.push({ loc, score: worth(g, loc) * chance - strength(def, false) * 0.2, need: 0 });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** One more unit for the best target that still needs it, or null when every target has enough. */
function nextAttack(g: Front, style: Style): Action | null {
  const p = g.power;
  for (const tgt of targets(g, style)) {
    const def = enemiesAt(g, p, tgt.loc);
    const committed = mineAt(g, tgt.loc).filter((u) => u.fought);
    const enough =
      style === 'colonel'
        ? strength(committed, true) >= tgt.need &&
          committed.some((u) => unitType(u.kind).domain !== 'air')
        : winChance(committed, def, 60, tgt.loc + 7) >= 0.7 &&
          (isSea(tgt.loc) || committed.some((u) => unitType(u.kind).domain === 'land'));
    if (enough) continue;
    const avail = reachers(g, tgt.loc).filter((u) => !keep(g, u, style));
    // Land units first (they take ground), strongest first; then air and ships.
    const pick = avail.sort((a, b) => {
      const la = unitType(a.kind).domain === 'land' ? 1 : 0;
      const lb = unitType(b.kind).domain === 'land' ? 1 : 0;
      return lb - la || unitType(b.kind).attack - unitType(a.kind).attack || a.id - b.id;
    })[0];
    if (pick) return { t: 'move', kind: pick.kind, from: pick.loc, to: tgt.loc, n: 1 };
  }
  // The general also lands troops by sea on a weak enemy coast.
  if (style === 'general') {
    for (const tr of g.units.filter(
      (u) => u.owner === p && u.kind === 'transport' && u.moved === 0 && !u.fought,
    )) {
      for (const from of LOCS[tr.loc]!.adj.filter((l) => !isSea(l) && g.owner[l] === p)) {
        const troops = mineAt(g, from).filter(
          (u) => unitType(u.kind).domain === 'land' && u.moved === 0 && !u.fought,
        );
        if (troops.length < 3) continue;
        const kinds: UnitKind[] = troops.some((u) => u.kind === 'armor')
          ? ['infantry', 'armor']
          : ['infantry', 'infantry'];
        for (let to = 0; to < LOCS.length; to++) {
          if (isSea(to) || !enemyOf(p, g.owner[to]!)) continue;
          const def = enemiesAt(g, p, to);
          if (strength(def, false) > 2) continue;
          if (!canSail(g, from, tr.loc, to, kinds)) continue;
          const fake = kinds.map((k, i) => ({
            id: -1 - i,
            kind: k,
            owner: p,
            loc: to,
            moved: 0,
            hits: 0,
            fought: true,
          }));
          if (winChance(fake, def, 40, to) >= 0.75)
            return { t: 'sail', from, sea: tr.loc, to, kinds };
        }
      }
    }
  }
  return null;
}

/** A spare unit stepping toward the front (the general: the front under most threat). */
function nextShift(g: Front, style: Style): Action | null {
  const p = g.power;
  const front = (loc: number) =>
    !isSea(loc) &&
    allied(p, g.owner[loc]!) &&
    LOCS[loc]!.adj.some((a) => !isSea(a) && enemyOf(p, g.owner[a]!));
  const fronts = LOCS.map((_, i) => i).filter(front);
  if (!fronts.length) return null;
  for (const u of g.units) {
    if (u.owner !== p || u.fought || u.moved !== 0) continue;
    const t = unitType(u.kind);
    if (t.domain === 'sea') continue;
    if (front(u.loc)) continue;
    if (keep(g, u, style)) continue;
    const goals =
      style === 'general' ? [...fronts].sort((a, b) => threat(g, b) - threat(g, a)) : fronts;
    const pass =
      t.domain === 'land' ? (l: number) => !isSea(l) && allied(p, g.owner[l]!) : () => true;
    // The reachable friendly place closest to a goal.
    let best: number | null = null;
    let bd = hops(u.loc, goals[0]!, pass, 30);
    for (let to = 0; to < LOCS.length; to++) {
      if (!canMove(g, u, to)) continue;
      const d = Math.min(...goals.slice(0, 3).map((gl) => hops(to, gl, pass, 30)));
      if (d < bd) {
        bd = d;
        best = to;
      }
    }
    if (best !== null) return { t: 'move', kind: u.kind, from: u.loc, to: best, n: 1 };
  }
  return null;
}

export function decide(g: Front, style: Style, rng: Rng): Action {
  const p = g.power;
  switch (g.phase) {
    case 'over':
      throw new Error('Game over');
    case 'buy': {
      const plan = buyPlan(g);
      const have = [...g.bought];
      for (const k of plan) {
        const i = have.indexOf(k);
        if (i >= 0) have.splice(i, 1);
        else if (legalActions(g).some((a) => a.t === 'buy' && a.kind === k))
          return { t: 'buy', kind: k };
      }
      return { t: 'next' };
    }
    case 'combat':
      return nextAttack(g, style) ?? { t: 'next' };
    case 'battle': {
      const b = g.battle!;
      const att = mineAt(g, b.loc);
      const def = enemiesAt(g, p, b.loc);
      if (b.round > 0) {
        const odds =
          style === 'general'
            ? winChance(att, def, 40, b.round + b.loc)
            : strength(att, true) / Math.max(1, strength(def, false));
        if (style === 'general' ? odds < 0.3 : odds < 0.6) return { t: 'retreat' };
      }
      return { t: 'roll' };
    }
    case 'move':
      return nextShift(g, style) ?? { t: 'next' };
    case 'place': {
      const k = g.bought[0];
      if (k === undefined) return { t: 'next' };
      const spots = placeSpots(g, k);
      if (!spots.length) return { t: 'next' };
      if (style === 'colonel') return { t: 'place', kind: k, loc: spots[0]! };
      // Nearest the most threatened front.
      const pick = spots.reduce((a, b) => (threat(g, b) > threat(g, a) ? b : a), spots[0]!);
      void rng;
      return { t: 'place', kind: k, loc: pick };
    }
  }
}

class FrontAgent implements Agent<Front, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Front, Action>, g: Front, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Front, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'colonel',
    kind: 'heuristic',
    label: { en: 'Colonel', es: 'Coronel' },
    description: {
      en: 'Buys infantry and armour, attacks with a clear edge in strength and moves spare units to the front.',
      es: 'Compra infantería y blindados, ataca con clara ventaja de fuerza y lleva las unidades libres al frente.',
    },
    create: () => new FrontAgent('colonel', 'Colonel', 'colonel'),
  },
  {
    id: 'general',
    kind: 'search',
    label: { en: 'General', es: 'General' },
    description: {
      en: 'Simulates every battle before fighting it, lands troops by sea on weak coasts and reinforces the front under most threat.',
      es: 'Simula cada batalla antes de librarla, desembarca en costas débiles y refuerza el frente más amenazado.',
    },
    create: () => new FrontAgent('general', 'General', 'general'),
  },
];
