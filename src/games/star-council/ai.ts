/**
 * Star Council computer players. The board, the revealed objectives and the agenda in play are
 * public; they never read the generator or the order of the decks. Every decision is one action,
 * recomputed from the board, so a tactical action is built step by step.
 *
 * - Envoy: values each system it could activate by the planets it can claim with the infantry its
 *   carriers can bring, attacks fleets it outguns by half again, builds at its docks when it has the
 *   resources, plays its strategy cards early and votes for whatever helps it.
 * - Regent: the same, plus space-battle odds simulated with the real combat rules (attacks at
 *   70 %, retreats under 25 %), works toward the public objectives it does not meet yet (strategy
 *   cards for technologies and docks, dreadnoughts, fleet presence, planets beside or inside enemy
 *   homes, the Nexus), keeps Dominion until it can score twice in a round, holds back from far
 *   attacks when an enemy fleet threatens its home, follows secondaries only when they pay, and
 *   saves its influence when a vote would not matter.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { Rng } from '../../core/game-engine/random';
import {
  bigShips,
  canScore,
  combatShips,
  currentPlayer,
  dockSpots,
  distance,
  emptyFleet,
  enemyAt,
  hitOn,
  homeOf,
  homePlayer,
  kindAt,
  legalActions,
  moveOf,
  onBoard,
  owned,
  planetsIn,
  productionAt,
  queueCost,
  researchCost,
  shipSystems,
  spaceOdds,
  spendable,
  capacityOf,
  type Action,
  type Fleet,
  type Star,
} from './engine';
import {
  ADJ,
  AGENDAS,
  CARDS,
  NEXUS_PLANET,
  OBJECTIVES,
  PLANETS,
  POS,
  SHIPS,
  TECH_IDS,
  UNITS,
  type Kind,
  type TechId,
} from './world';

export type Style = 'envoy' | 'regent';

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
const find = (legal: Action[], pred: (a: Action) => boolean) => legal.find(pred);

/** Rough fighting strength: expected hits per round. */
function strength(g: Star, p: number, f: Fleet) {
  let s = 0;
  for (const k of SHIPS) s += f[k] * ((11 - hitOn(g, p, k, 'space')) / 10);
  return s + (f.dread - f.damaged) * 0.4;
}

/** What p could bring into s this action: warships, plus fighters and infantry its carriers lift. */
function forces(g: Star, p: number, s: number) {
  const fleet = { ...g.space[s]![p]! };
  let inf = fleet.infantry;
  for (const from of shipSystems(g, p)) {
    if (from === s || g.tokens[from]![p]) continue;
    const f = g.space[from]![p]!;
    const d = distance(g, p, from, s);
    let cap = 0;
    for (const k of ['cruiser', 'carrier', 'dread'] as const)
      if (f[k] > 0 && d <= moveOf(g, p, k)) {
        fleet[k] += f[k];
        if (k !== 'cruiser') cap += f[k] * capacityOf(g, p, { ...emptyFleet(), [k]: 1 });
      }
    if (cap > 0) {
      const ground =
        f.infantry +
        planetsIn(g, from)
          .filter((pl) => pl.owner === p)
          .reduce((n, pl) => n + pl.inf, 0);
      const lift = Math.max(0, Math.min(ground, cap));
      inf += lift;
      fleet.fighter += Math.min(f.fighter, cap - lift);
    }
  }
  return { fleet, inf };
}

const infNeed = (pl: { owner: number; inf: number }) =>
  pl.inf === 0 ? 1 : pl.inf + 2 + (pl.owner === -2 ? 1 : 0);
const worth = (id: number) => PLANETS[id]!.r + PLANETS[id]!.i;

/** How much activating s is worth to p now (0 or less: not worth a token). */
function activationValue(g: Star, p: number, s: number, style: Style, rng: Rng) {
  if (g.tokens[s]![p] || kindAt(g, s) === 'field') return -1;
  const { fleet, inf } = forces(g, p, s);
  let value = 0;
  const e = enemyAt(g, p, s);
  if (e >= 0) {
    const ef = g.space[s]![e]!;
    if (style === 'regent') {
      if (spaceOdds(g, p, fleet, e, ef, 40, rng) < 0.7) return -1;
    } else if (strength(g, p, fleet) < 1.5 * strength(g, e, ef)) return -1;
    value += 0.6 * SHIPS.reduce((n, k) => n + ef[k] * UNITS[k].cost, 0);
  }
  let left = inf;
  const targets = planetsIn(g, s)
    .filter((pl) => pl.owner !== p)
    .sort((a, b) => worth(b.id) - worth(a.id));
  for (const pl of targets) {
    const need = infNeed(pl);
    if (left < need) continue;
    left -= need;
    value += worth(pl.id) + 1 + (pl.owner >= 0 ? 1.5 : 0);
    if (style === 'regent') {
      const want = goals(g, p);
      const h = homePlayer(g, s);
      if (want.includes('strike') && h >= 0 && h !== p) value += 4;
      if (
        want.includes('frontier') &&
        ADJ[s]!.some((t) => {
          const o = homePlayer(g, t);
          return o >= 0 && o !== p;
        })
      )
        value += 2.5;
      if ((want.includes('planets6') || want.includes('planets10')) && pl.owner < 0) value += 1;
    }
    if (pl.id === NEXUS_PLANET) value += style === 'regent' ? 7 : 3;
  }
  if (productionAt(g, p, s) > 0 && e < 0) {
    const budget = spendable(g, p, 'res') + g.ps[p]!.tg;
    if (budget >= 3) value += Math.min(budget, productionAt(g, p, s)) * 0.5;
  }
  if (style === 'regent') {
    // Presence for the fleet objectives on the table.
    const wantShips = g.revealed.some(
      (o) =>
        (OBJECTIVES[o]!.id === 'ships4' || OBJECTIVES[o]!.id === 'ships6') &&
        !g.ps[p]!.scored.includes(o),
    );
    if (wantShips && combatShips(g.space[s]![p]!) === 0 && bigShips(fleet) > 0 && e < 0)
      value += 1.2;
    // Do not leave home bare when an enemy fleet is close.
    const home = homeOf(g, p);
    if (s !== home) {
      const threat = Math.max(
        0,
        ...g.ps.map((_, q) =>
          q === p
            ? 0
            : shipSystems(g, q).reduce(
                (n, t) => n + (distance(g, q, t, home) <= 2 ? strength(g, q, g.space[t]![q]!) : 0),
                0,
              ),
        ),
      );
      const homeLeft = strength(g, p, g.space[home]![p]!);
      if (threat > 0.8 && homeLeft < threat && value > 0) value -= 1.5;
    }
  }
  return value;
}

function techPick(choices: number[], style: Style) {
  const order: TechId[] =
    style === 'regent'
      ? ['drills', 'hull', 'ion', 'envoy', 'assault', 'logistics', 'wings', 'warp']
      : [...TECH_IDS];
  return bestBy(choices, (x) => (x < 0 ? -99 : -order.indexOf(TECH_IDS[x]!)))!;
}
const objPick = (choices: number[]) =>
  bestBy(choices, (o) =>
    o < 0 ? -99 : OBJECTIVES[o]!.stage * 10 - (OBJECTIVES[o]!.spend ? 1 : 0),
  )!;
const dockPick = (choices: number[]) => bestBy(choices, (id) => (id < 0 ? -99 : PLANETS[id]!.r))!;

function cardValue(g: Star, p: number, c: number, style: Style) {
  const me = g.ps[p]!;
  const scorable = g.revealed.filter((o) => canScore(g, p, o));
  const nexus = g.planets.find((pl) => pl.id === NEXUS_PLANET)!.owner === p;
  switch (CARDS[c]!) {
    case 'command':
      return 2 + (me.tokens <= 2 ? 2 : 0);
    case 'accord':
      return (
        owned(g, p)
          .filter((pl) => !pl.ready)
          .reduce((n, pl) => n + worth(pl.id), 0) / 2
      );
    case 'commerce':
      return 2.5;
    case 'industry':
      return dockSpots(g, p).length ? 2.5 : 0.3;
    case 'research':
      return TECH_IDS.some((t) => !me.techs.includes(t)) ? 3 : 0.2;
    case 'dominion':
      return (
        (scorable.length ? 5 * Math.max(...scorable.map((o) => OBJECTIVES[o]!.stage)) : 0.1) +
        (nexus ? 2 : 0) +
        (style === 'regent' && !scorable.length && !nexus ? -0.5 : 0)
      );
  }
}

/** Unscored public objectives on the table that p does not meet yet. */
const goals = (g: Star, p: number) =>
  g.revealed
    .filter((o) => !g.ps[p]!.scored.includes(o) && !canScore(g, p, o))
    .map((o) => OBJECTIVES[o]!.id);

function pickValue(g: Star, p: number, c: number, style: Style): number {
  const me = g.ps[p]!;
  const tg = g.cardTg[c]!;
  if (style === 'regent') {
    const want = goals(g, p);
    const bias =
      CARDS[c] === 'research' && want.some((o) => o === 'tech2' || o === 'tech5')
        ? 2
        : CARDS[c] === 'industry' && want.includes('docks2') && dockSpots(g, p).length
          ? 2
          : CARDS[c] === 'commerce' && want.includes('spendTg4')
            ? 1.5
            : 0;
    if (bias) return pickValue(g, p, c, 'envoy') + bias;
  }
  switch (CARDS[c]!) {
    case 'command':
      return 2 + (me.tokens <= 3 ? 1.5 : 0) + tg;
    case 'accord':
      return 1.2 + tg;
    case 'commerce':
      return 2.5 + tg;
    case 'industry':
      return (dockSpots(g, p).length ? 2.4 : 0.5) + tg;
    case 'research':
      return 2.8 + tg;
    case 'dominion':
      return 2 + tg;
  }
}

function buildChoice(g: Star, p: number, legal: Action[], style: Style): Action {
  const q = g.act!.queue;
  const budget = spendable(g, p, 'res') + g.ps[p]!.tg;
  const reserve = style === 'regent' ? 0 : 1;
  const count = (k: Kind) => q.filter((x) => x === k).length;
  const total = (k: Kind) => onBoard(g, p, k) + count(k);
  const order: Kind[] = [];
  if (total('carrier') < 2) order.push('carrier');
  if (count('infantry') < 2) order.push('infantry');
  if (
    style === 'regent' &&
    total('dread') < 3 &&
    budget - queueCost(q) >= (goals(g, p).includes('dreads3') ? 4 : 6)
  )
    order.push('dread');
  if (count('cruiser') < 1) order.push('cruiser');
  order.push('infantry', 'fighter', 'cruiser');
  for (const k of order) {
    if (queueCost(q) + UNITS[k].cost > budget - reserve) continue;
    const a = find(legal, (x) => x.t === 'build' && x.kind === k);
    if (a) return a;
  }
  return { t: 'done' };
}

function moveChoice(g: Star, p: number, legal: Action[], style: Style, rng: Rng): Action {
  const s = g.act!.sys;
  const mine = g.space[s]![p]!;
  const e = enemyAt(g, p, s);
  const moves = legal.filter((a): a is Extract<Action, { t: 'move' }> => a.t === 'move');
  const maxOf = (pred: (a: Extract<Action, { t: 'move' }>) => boolean) =>
    bestBy(moves.filter(pred), (a) => a.n);
  // 1. Enough warships to win.
  if (e >= 0) {
    const ef = g.space[s]![e]!;
    const good =
      style === 'regent'
        ? combatShips(mine) > 0 && spaceOdds(g, p, mine, e, ef, 40, rng) >= 0.85
        : strength(g, p, mine) >= 1.5 * strength(g, e, ef);
    if (!good) {
      for (const k of ['dread', 'cruiser', 'carrier'] as const) {
        const a = maxOf((m) => m.kind === k);
        if (a) return a;
      }
      const f = maxOf((m) => m.kind === 'fighter');
      if (f) return f;
    }
  }
  // 2. Infantry for the planets here.
  const need = planetsIn(g, s)
    .filter((pl) => pl.owner !== p)
    .reduce((n, pl) => n + infNeed(pl), 0);
  if (need > mine.infantry) {
    const inf = moves.filter((m) => m.kind === 'infantry');
    if (inf.length) {
      const want = need - mine.infantry;
      const byFrom = new Map<number, number>();
      for (const m of inf) byFrom.set(m.from, Math.max(byFrom.get(m.from) ?? 0, m.n));
      for (const [from, n] of byFrom) {
        const ground =
          g.space[from]![p]!.infantry +
          planetsIn(g, from)
            .filter((pl) => pl.owner === p)
            .reduce((k, pl) => k + pl.inf, 0);
        const take = Math.min(n, want, ground);
        if (take > 0) return { t: 'move', from, kind: 'infantry', n: take };
      }
    }
    // A carrier (or dreadnought) from somewhere with infantry to lift.
    for (const k of ['carrier', 'dread'] as const) {
      const a = bestBy(
        moves.filter((m) => {
          if (m.kind !== k || g.act!.from.includes(m.from)) return false;
          const ground =
            g.space[m.from]![p]!.infantry +
            planetsIn(g, m.from)
              .filter((pl) => pl.owner === p)
              .reduce((n, pl) => n + pl.inf, 0);
          return ground > 0;
        }),
        (m) => -m.n,
      );
      if (a) return { ...a, n: 1 };
    }
  }
  // 3. Fighters ride along when there is a fight.
  if (e >= 0) {
    const f = maxOf((m) => m.kind === 'fighter');
    if (f) return f;
  }
  return { t: 'done' };
}

function landChoice(g: Star, p: number, legal: Action[]): Action {
  const s = g.act!.sys;
  const have = g.space[s]![p]!.infantry;
  const targets = planetsIn(g, s)
    .filter((pl) => pl.owner !== p)
    .sort((a, b) => worth(b.id) - worth(a.id));
  for (const pl of targets) {
    const need = infNeed(pl);
    if (have >= need) return { t: 'land', planet: pl.id, n: need };
  }
  const weakest = targets.find((pl) => pl.inf < have);
  if (weakest && targets.length === 1) return { t: 'land', planet: weakest.id, n: have };
  const mine = planetsIn(g, s)
    .filter((pl) => pl.owner === p)
    .sort((a, b) => a.inf - b.inf)[0];
  if (mine && have > 0) return { t: 'land', planet: mine.id, n: have };
  return find(legal, (a) => a.t === 'done') ?? legal[0]!;
}

function followChoice(g: Star, p: number, legal: Action[], style: Style): Action {
  const me = g.ps[p]!;
  const card = CARDS[g.follow!.card]!;
  const xs = legal.filter((a): a is { t: 'follow'; x: number } => a.t === 'follow').map((a) => a.x);
  const yes = (x: number): Action => ({ t: 'follow', x });
  if (!xs.length) return { t: 'decline' };
  const res = spendable(g, p, 'res') + me.tg;
  switch (card) {
    case 'command':
      if (me.tokens <= (style === 'regent' ? 3 : 2) && spendable(g, p, 'inf') >= 5) return yes(-1);
      break;
    case 'accord': {
      const ex = owned(g, p)
        .filter((pl) => !pl.ready)
        .reduce((n, pl) => n + worth(pl.id), 0);
      if (ex >= 4 && me.tokens >= 3) return yes(-1);
      break;
    }
    case 'commerce':
      if (me.tokens >= (style === 'regent' ? 4 : 3)) return yes(-1);
      break;
    case 'industry':
      if (me.tokens >= 2 && res >= 6) return yes(dockPick(xs));
      break;
    case 'research':
      if (me.tokens >= 2 && res >= researchCost(g, p) + 1) return yes(techPick(xs, style));
      break;
    case 'dominion':
      return yes(objPick(xs));
  }
  return { t: 'decline' };
}

function voteChoice(g: Star, p: number, style: Style): Action {
  const c = g.council!;
  const a = AGENDAS[c.agenda]!;
  const me = g.ps[p]!;
  if (a.elect) {
    if (a.id === 'censure') {
      const leader = bestBy(
        g.ps.map((_, q) => q).filter((q) => q !== p),
        (q) => g.ps[q]!.vp,
      )!;
      return { t: 'vote', option: leader };
    }
    return { t: 'vote', option: p };
  }
  const mine = owned(g, p);
  let forV = 0;
  switch (a.id) {
    case 'lanes':
      forV = 0.5;
      break;
    case 'shipwright':
      forV = mine.filter((pl) => pl.dock).length * 0.5;
      break;
    case 'fleet':
      forV = 1;
      break;
    case 'mining':
      forV =
        mine.filter((pl) => PLANETS[pl.id]!.r >= 3).length -
        mine.filter((pl) => PLANETS[pl.id]!.i >= 3).length;
      break;
    case 'disarm': {
      const others = Math.max(...g.ps.map((_, q) => (q === p ? 0 : onBoard(g, q, 'dread'))));
      forV = others > onBoard(g, p, 'dread') ? 1 : -1;
      break;
    }
    case 'archives':
      forV = me.techs.length === Math.min(...g.ps.map((x) => x.techs.length)) ? 2 : -0.5;
      break;
    case 'watch':
      forV = 0.5;
      break;
  }
  if (style === 'regent' && Math.abs(forV) < 1) return { t: 'abstain' };
  if (forV === 0) return { t: 'abstain' };
  return { t: 'vote', option: forV > 0 ? 0 : 1 };
}

export function decide(g: Star, style: Style, rng: Rng): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  const p = currentPlayer(g);
  switch (g.phase) {
    case 'strategy': {
      const picks = legal.filter((a): a is { t: 'pick'; card: number } => a.t === 'pick');
      return bestBy(picks, (a) => pickValue(g, p, a.card, style) + rng.float() * 0.3)!;
    }
    case 'status': {
      const xs = legal.filter((a): a is { t: 'score'; obj: number } => a.t === 'score');
      if (!xs.length) return { t: 'skip' };
      return { t: 'score', obj: objPick(xs.map((a) => a.obj)) };
    }
    case 'council':
      return voteChoice(g, p, style);
    case 'follow':
      return followChoice(g, p, legal, style);
    default:
      break;
  }
  const a = g.act;
  if (a) {
    switch (a.step) {
      case 'move':
        return moveChoice(g, p, legal, style, rng);
      case 'space': {
        const s = a.sys;
        const e = g.battle!.defender;
        const retreat = find(legal, (x) => x.t === 'retreat');
        if (retreat) {
          const mine = g.space[s]![p]!;
          const theirs = g.space[s]![e]!;
          const bad =
            style === 'regent'
              ? spaceOdds(g, p, mine, e, theirs, 40, rng) < 0.25
              : strength(g, p, mine) < 0.5 * strength(g, e, theirs);
          if (bad) return retreat;
        }
        return { t: 'roll' };
      }
      case 'land':
        return landChoice(g, p, legal);
      case 'build':
        return buildChoice(g, p, legal, style);
    }
  }
  const me = g.ps[p]!;
  const unplayed = me.cards.filter((c) => !me.played.includes(c));
  const plays = legal.filter((x): x is { t: 'play'; card: number; x: number } => x.t === 'play');
  const bestCard = bestBy(unplayed, (c) => cardValue(g, p, c, style));
  const cv = bestCard !== undefined ? cardValue(g, p, bestCard, style) : -Infinity;
  let bestSys = -1;
  let bv = 0.99;
  if (me.tokens > 0)
    for (let s = 0; s < POS.length; s++) {
      const v = activationValue(g, p, s, style, rng);
      if (v > bv) {
        bv = v;
        bestSys = s;
      }
    }
  const playCard = (c: number): Action => {
    const xs = plays.filter((x) => x.card === c).map((x) => x.x);
    const id = CARDS[c]!;
    const x =
      id === 'research'
        ? techPick(xs, style)
        : id === 'dominion'
          ? objPick(xs)
          : id === 'industry'
            ? dockPick(xs)
            : xs[0]!;
    return { t: 'play', card: c, x };
  };
  if (bestCard !== undefined && (cv >= bv || bestSys < 0 || me.tokens === 0)) {
    // Dominion waits for the end unless it scores now.
    if (
      CARDS[bestCard] !== 'dominion' ||
      bestSys < 0 ||
      (style === 'regent' ? g.revealed.filter((o) => canScore(g, p, o)).length >= 2 : cv >= 2)
    )
      return playCard(bestCard);
  }
  if (bestSys >= 0) return { t: 'activate', sys: bestSys };
  if (bestCard !== undefined) return playCard(bestCard);
  return find(legal, (x) => x.t === 'pass') ?? legal[0]!;
}

class StarAgent implements Agent<Star, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Star, Action>, g: Star, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Star, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'envoy',
    kind: 'heuristic',
    label: { en: 'Envoy', es: 'Enviado' },
    description: {
      en: 'Claims the planets its carriers can reach, attacks fleets it clearly outguns, builds when it can and plays its cards early.',
      es: 'Reclama los planetas que alcanzan sus portanaves, ataca flotas a las que supera con claridad, construye cuando puede y juega pronto sus cartas.',
    },
    create: () => new StarAgent('envoy', 'Envoy', 'envoy'),
  },
  {
    id: 'regent',
    kind: 'heuristic',
    label: { en: 'Regent', es: 'Regente' },
    description: {
      en: 'Simulates space battles, chases the public objectives and the Nexus, guards its home, follows secondaries only when they pay and saves influence when a vote does not matter.',
      es: 'Simula las batallas espaciales, persigue los objetivos públicos y el Nexo, guarda su sistema natal, solo sigue secundarias que compensan y ahorra influencia cuando un voto no importa.',
    },
    create: () => new StarAgent('regent', 'Regent', 'regent'),
  },
];

/** A fresh generator for hints and tests. */
export const hintRng = (g: Star) => new Rng(g.round * 101 + g.log.length);
