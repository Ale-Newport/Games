/**
 * Farmstead computer players. The board is public; they never read the order of the round spaces
 * still to come.
 *
 * - Farmhand: takes the choice whose resulting farm is worth most — its current score plus plain
 *   values for goods and food, minus the begging its food stocks would cause at the next harvest —
 *   finishing the steps a space starts (building, ploughing, sowing…) the same way.
 * - Steward: values farms by the rounds left too (a family member by the work it will still do, a
 *   free room by the growth it allows, progress toward the next room, sown crops by what they will
 *   still yield, a hearth by the food it unlocks, food planned for every harvest left) and counts
 *   what a space would have been worth to a rival. It ranks its placements that way, then tries the
 *   best three in two imagined futures each — the round spaces still to come reshuffled within
 *   their stages, since it cannot know them — played three rounds on by farmhands, and takes the
 *   one that leaves it furthest ahead of the strongest rival by its own measure.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import {
  apply as act,
  cookRates,
  currentPlayer,
  legalActions,
  rooms,
  scoreFarm,
  spaceId,
  type Action,
  type Farm,
  type Farmer,
} from './engine';
import { ANIMALS, FOOD_PER_MEMBER, HARVESTS, MAX_FAMILY, ROUNDS, SPACES } from './world';

export type Style = 'farmhand' | 'steward';

const roundsLeft = (g: Farm) => ROUNDS - g.round + (g.phase === 'over' ? 0 : 1);
const harvestsLeft = (g: Farm) => HARVESTS.filter((h) => h >= g.round).length;

/** Food p can still raise from stock (raw or cooked). */
function foodStock(f: Farmer) {
  const r = cookRates(f);
  let food = f.goods.food + f.goods.grain * (r ? r.bake : 1) + f.goods.veg * (r ? r.veg : 1);
  if (r) for (const k of ANIMALS) food += Math.max(0, f.animals[k] - 2) * r[k];
  return food;
}

export function value(g: Farm, p: number, style: Style): number {
  const f = g.ps[p]!;
  const s = scoreFarm(f);
  if (g.phase === 'over') return s.total;
  const L = roundsLeft(g);
  const H = harvestsLeft(g);
  let v = s.total;
  // Goods: what they can still build or feed.
  const late = L <= 2 ? 0.3 : 1;
  v +=
    (f.goods.timber * 0.5 + f.goods.clay * 0.55 + f.goods.reed * 0.7 + f.goods.stone * 0.65) * late;
  v += f.goods.food * 0.4;
  if (style === 'farmhand') {
    const need = f.members * FOOD_PER_MEMBER;
    const short = Math.max(0, need - foodStock(f));
    return v - (H > 0 ? short * 1.6 : 0);
  }
  // Steward: the future.
  const r = cookRates(f);
  v += f.members * Math.min(L, 8) * 1.2;
  const growing = f.members < MAX_FAMILY && L >= 3;
  if (rooms(f) > f.members && growing) v += 1 + Math.min(L, 8) * 0.4;
  if (growing && rooms(f) <= f.members) {
    // Progress toward the next room.
    const cost =
      f.material === 'wood' ? f.goods.timber : f.material === 'clay' ? f.goods.clay : f.goods.stone;
    v += (Math.min(1, cost / 5) * 0.6 + Math.min(1, f.goods.reed / 2) * 0.4) * 3;
  }
  for (const c of f.cells) {
    if (c.crop) v += Math.min(c.n, H) * (c.crop === 'veg' ? 1.2 : 0.8);
    else if (c.kind === 'field' && H > 0) v += 1;
  }
  if (r) v += Math.min(H, 3) * 1.2;
  // Food plan: every harvest left needs the family fed; income from fishing and labour is
  // roughly 1.2 food a round.
  const need = H * f.members * FOOD_PER_MEMBER;
  const crops = f.cells.reduce(
    (n, c) => n + (c.crop ? Math.min(c.n, H) * (r ? (c.crop === 'veg' ? r.veg : r.bake) : 1) : 0),
    0,
  );
  const income = L * 1.1;
  const short = Math.max(0, need - foodStock(f) - crops - income);
  v -= short * (H <= 1 ? 3 : 1.4);
  // Animals breed into points while there is room.
  for (const k of ANIMALS) if (f.animals[k] >= 2 && H > 0) v += 0.6;
  return v;
}

/** Plays out p's pending steps greedily (no lookahead into other players). */
function finishSteps(g: Farm, p: number, style: Style, rng: Rng): Farm {
  let s = g;
  for (let k = 0; k < 40 && s.phase === 'sub' && currentPlayer(s) === p; k++)
    s = act(s, bestStep(s, p, style, rng));
  return s;
}
function bestStep(g: Farm, p: number, style: Style, rng: Rng): Action {
  const legal = legalActions(g);
  let best = legal[legal.length - 1]!;
  let bv = -Infinity;
  for (const a of legal) {
    const v = value(act(g, a), p, style) + rng.float() * 0.01;
    if (v > bv) {
      bv = v;
      best = a;
    }
  }
  return best;
}

function placeValue(g: Farm, p: number, space: number, style: Style, rng: Rng) {
  const after = finishSteps(act(g, { t: 'place', space }), p, style, rng);
  let v = value(after, p, style);
  if (style === 'steward') {
    // Denial: what this space would have been worth to the strongest rival.
    let deny = 0;
    for (let q = 0; q < g.players; q++) {
      if (q === p || g.ps[q]!.workers <= 0) continue;
      const id = spaceId(space);
      if (id === 'growth' || id === 'hurried') deny = Math.max(deny, 1.5);
      if (SPACES[space]!.accrue) {
        const lying = Object.values(g.stock[space]!).reduce((n, x) => n + (x ?? 0), 0);
        if (lying >= 4) deny = Math.max(deny, lying * 0.15);
      }
    }
    v += deny;
  }
  return v;
}

function greedy(g: Farm, style: Style, rng: Rng): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  const p = currentPlayer(g);
  if (g.phase === 'sub') return bestStep(g, p, style, rng);
  return rankPlaces(g, p, style, rng, legal)[0]!.a;
}

function rankPlaces(g: Farm, p: number, style: Style, rng: Rng, legal: Action[]) {
  return legal
    .filter((a) => a.t === 'place')
    .map((a) => ({
      a,
      v: placeValue(g, p, (a as { space: number }).space, style, rng) + rng.float() * 0.01,
    }))
    .sort((x, y) => y.v - x.v);
}

/** A world p could be in: the round spaces still to come reshuffled within their stages. */
function determinize(g: Farm, rng: Rng): Farm {
  const w = structuredClone(g);
  const byStage = new Map<number, number[]>();
  for (const i of w.future) {
    const st = SPACES[i]!.stage!;
    byStage.set(st, [...(byStage.get(st) ?? []), i]);
  }
  w.future = [...byStage.keys()].sort().flatMap((st) => rng.shuffle(byStage.get(st)!));
  return w;
}

/** Plays a world a few rounds on with farmhands everywhere; p's margin by the steward's measure. */
function rollout(w: Farm, p: number, rng: Rng) {
  let g = w;
  const until = g.round + HORIZON;
  for (let k = 0; k < 3000 && g.phase !== 'over' && g.round < until; k++)
    g = act(g, greedy(g, 'farmhand', rng));
  const mine = value(g, p, 'steward');
  const best = Math.max(...g.ps.map((_, q) => (q === p ? -Infinity : value(g, q, 'steward'))));
  return mine - best;
}
const HORIZON = 3;

export function decide(g: Farm, style: Style, rng: Rng): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  const p = currentPlayer(g);
  if (g.phase === 'sub' || style === 'farmhand') return greedy(g, style, rng);
  const cands = rankPlaces(g, p, style, rng, legal).slice(0, 3);
  let best = cands[0]!.a;
  let bv = -Infinity;
  for (const c of cands) {
    let sum = 0;
    for (let k = 0; k < 2; k++) {
      const first = finishSteps(act(determinize(g, rng), c.a), p, style, rng);
      sum += rollout(first, p, rng);
    }
    if (sum > bv) {
      bv = sum;
      best = c.a;
    }
  }
  return best;
}

class FarmAgent implements Agent<Farm, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Farm, Action>, g: Farm, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Farm, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'farmhand',
    kind: 'heuristic',
    label: { en: 'Farmhand', es: 'Peón' },
    description: {
      en: 'Takes the space that leaves its farm scoring most right now, with an eye on the next harvest.',
      es: 'Toma el espacio que deja su granja con más puntos ahora mismo, sin perder de vista la próxima cosecha.',
    },
    create: () => new FarmAgent('farmhand', 'Farmhand', 'farmhand'),
  },
  {
    id: 'steward',
    kind: 'heuristic',
    label: { en: 'Steward', es: 'Mayoral' },
    description: {
      en: 'Values family, rooms, crops and goods by the rounds left, plans food for every harvest and blocks spaces rivals need.',
      es: 'Valora familia, habitaciones, cosechas y bienes según las rondas que quedan, planifica la comida de cada cosecha y bloquea espacios que necesitan los rivales.',
    },
    create: () => new FarmAgent('steward', 'Steward', 'steward'),
  },
];
