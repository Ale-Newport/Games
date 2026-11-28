/**
 * Iron Fields computer players. The board, resources and stars are public; they never read the
 * encounter deck or a rival's secret bid. A turn is judged as a whole: each section is played
 * out step by step with the best-looking choice, and the turn that leaves the player's position
 * worth most is taken.
 *
 * - Recruit: a position is worth its coins at the end-of-game rates now (stars, territories and
 *   resource pairs at its popularity tier) plus fixed values for upgrades, mechs, structures,
 *   recruits, workers, power and resources toward its next bottom action. It bids in a fight
 *   only what it needs to be sure to win, and stays out of fights it cannot win.
 * - Marshal: the same, then tries its best three sections in an imagined game played to the end
 *   by recruits — the encounter deck reshuffled, since it cannot know it — and takes the one that
 *   ends furthest ahead of its strongest rival in the final count.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import {
  apply,
  currentPlayer,
  fid,
  hasAbility,
  legalActions,
  scoreAll,
  unitsAt,
  workers,
  type Action,
  type Iron,
} from './engine';
import { BOTTOM, BOTTOMS, MAX_BID, MAX_WORKERS, RES, STARS_TO_END } from './world';

export type Style = 'recruit' | 'marshal';
const WIN_BONUS = 40;

export function value(g: Iron, p: number): number {
  const me = g.ps[p]!;
  const s = (g.scores ?? scoreAll(g))[p]!.total;
  // A finished game is worth its count, and a lot more if it is won: ending it while ahead is good.
  if (g.phase === 'over') return s + (g.winners.includes(p) ? WIN_BONUS : 0);
  // Development counts less as the end (five stars for anyone) comes near.
  const near = Math.max(...g.ps.map((x) => x.stars.length)) / STARS_TO_END;
  const w = 1 - 0.6 * near;
  let v = s;
  v += me.stars.length * 6;
  v +=
    (me.improved.length * 4 + me.mechs * 4 + me.structures.length * 3 + me.recruits.length * 3) * w;
  v += Math.min(workers(g, p), MAX_WORKERS) * 2.2 * w;
  v += (me.power * 0.35 + me.popularity * 0.3) * w;
  // Resources toward the bottom actions still to do.
  for (const b of BOTTOMS) {
    const r = BOTTOM[b].res;
    const need = me.costs[b];
    v += Math.min(me.res[r], need) * 0.5;
  }
  v += RES.reduce((n, r) => n + me.res[r], 0) * 0.15;
  return v;
}

/** The most a side could field in a fight at hex, from the units there and its power. */
function maxTotal(g: Iron, side: number, hex: number, attacking: boolean) {
  const units = unitsAt(g, hex).filter((u) => u.owner === side && u.kind !== 'worker').length;
  const bonus = attacking
    ? (hasAbility(g, side, 4) ? 2 : 0) + (fid(g, side) === 'crown' ? 2 : 0)
    : hasAbility(g, side, 3)
      ? 2
      : 0;
  return { units: units + bonus, power: Math.min(MAX_BID, g.ps[side]!.power) };
}

/** A bid made without seeing the rival's: enough to be sure to win, or nothing. */
export function bid(g: Iron): Action {
  const b = g.battle!;
  const attacking = g.phase === 'attack';
  const me = attacking ? b.attacker : b.defender;
  const foe = attacking ? b.defender : b.attacker;
  const mine = maxTotal(g, me, b.hex, attacking);
  const theirs = maxTotal(g, foe, b.hex, !attacking);
  const theirBest = theirs.units + theirs.power;
  // Attackers win ties, so an attacker needs to match; a defender must beat.
  const need = Math.max(0, theirBest - mine.units + (attacking ? 0 : 1));
  return { t: 'bid', n: need <= mine.power ? need : 0 };
}

/** Settles a fight the step started, both sides bidding by the rule above. */
function settle(g: Iron): Iron {
  let s = g;
  for (let k = 0; k < 4 && (s.phase === 'attack' || s.phase === 'defend'); k++)
    s = apply(s, bid(s));
  return s;
}

function bestStep(g: Iron, p: number): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  let best = legal[0]!;
  let bv = -Infinity;
  for (const a of legal) {
    const v = value(settle(apply(g, a)), p);
    if (v > bv) {
      bv = v;
      best = a;
    }
  }
  return best;
}

/**
 * Plays p's turn to its end: bids by the rule above (for both sides), the encounter option and
 * every other step picked one step ahead.
 */
function finishTurn(g: Iron, p: number, depth: number): Iron {
  let s = g;
  for (let k = 0; k < 30 && s.phase !== 'over'; k++) {
    if (s.phase === 'attack' || s.phase === 'defend') {
      s = apply(s, bid(s));
      continue;
    }
    if (s.phase === 'choose' || currentPlayer(s) !== p) break;
    const legal = legalActions(s);
    if (depth > 0 || legal.length === 1) {
      s = apply(s, legal[0]!);
      continue;
    }
    let best = legal[0]!;
    let bv = -Infinity;
    for (const a of legal) {
      const v = value(settle(apply(s, a)), p);
      if (v > bv) {
        bv = v;
        best = a;
      }
    }
    s = apply(s, best);
  }
  return s;
}

function greedy(g: Iron, rng: Rng): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  if (g.phase === 'attack' || g.phase === 'defend') return bid(g);
  const p = currentPlayer(g);
  if (g.phase === 'encounter' || g.phase === 'turn') return bestStep(g, p);
  return rankSections(g, p, legal, rng)[0]!.a;
}

function rankSections(g: Iron, p: number, legal: Action[], rng: Rng) {
  return legal
    .map((a) => ({ a, v: value(finishTurn(apply(g, a), p, 0), p) + rng.float() * 0.01 }))
    .sort((x, y) => y.v - x.v);
}

/** A world p could be in: the encounter deck reshuffled. */
function determinize(g: Iron, rng: Rng): Iron {
  const w = structuredClone(g);
  w.deck = rng.shuffle(w.deck);
  return w;
}

/** Imagined games run to the end (the turn limit keeps them short enough). */
const HORIZON = 30;
const CANDIDATES = 3;
const ROLLOUTS = 1;
function rollout(w: Iron, p: number, rng: Rng) {
  let g = w;
  let turns = 0;
  for (let k = 0; k < 400 && g.phase !== 'over' && turns < HORIZON; k++) {
    const before = g.phase;
    g = apply(g, greedy(g, rng));
    if (before !== 'choose' && g.phase === 'choose') turns++;
  }
  // The count at the end (stars count a little extra in case the limit cut the game short).
  const ev = (q: number) => (g.scores ?? scoreAll(g))[q]!.total + g.ps[q]!.stars.length * 4;
  const mine = ev(p);
  const best = Math.max(...g.ps.map((_, q) => (q === p ? -Infinity : ev(q))));
  return mine - best;
}

export function decide(g: Iron, style: Style, rng: Rng): Action {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  if (style === 'recruit' || g.phase !== 'choose') return greedy(g, rng);
  const p = currentPlayer(g);
  const cands = rankSections(g, p, legal, rng).slice(0, CANDIDATES);
  let best = cands[0]!.a;
  let bv = -Infinity;
  for (const c of cands) {
    let sum = 0;
    for (let k = 0; k < ROLLOUTS; k++)
      sum += rollout(finishTurn(apply(determinize(g, rng), c.a), p, 0), p, rng);
    if (sum > bv) {
      bv = sum;
      best = c.a;
    }
  }
  return best;
}

class IronAgent implements Agent<Iron, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Iron, Action>, g: Iron, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Iron, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'recruit',
    kind: 'heuristic',
    label: { en: 'Recruit', es: 'Recluta' },
    description: {
      en: 'Plays each section out and takes the turn that leaves it worth most; bids only what it needs to be sure.',
      es: 'Juega cada sección hasta el final y toma el turno que más le vale; solo puja lo que necesita para asegurar.',
    },
    create: () => new IronAgent('recruit', 'Recruit', 'recruit'),
  },
  {
    id: 'marshal',
    kind: 'heuristic',
    label: { en: 'Marshal', es: 'Mariscal' },
    description: {
      en: 'Like the recruit, then plays its best three sections out to the end of the game against everyone else.',
      es: 'Como el recluta, y además juega sus tres mejores secciones hasta el final de la partida contra los demás.',
    },
    create: () => new IronAgent('marshal', 'Marshal', 'marshal'),
  },
];
