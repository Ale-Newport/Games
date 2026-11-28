/**
 * World Conquest computer players. Both see only the board and their own cards (others' hands
 * are counted, not read). Battle odds are exact: the chance an attack of A armies (rolling as many
 * dice as they may, up to three) takes a territory held by D, computed from every dice outcome.
 *
 * - General: builds on the landmass it is closest to holding, piles reinforcements on one front,
 *   attacks at good odds, keeps conquering armies on the front, moves idle armies forward.
 * - Marshal: values each territory (landmass bonuses gained or broken, a card for the first
 *   conquest, cards of a player it can knock out), attacks when the expected gain beats the
 *   expected losses, guards the borders of its landmasses and splits armies by threat.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { legalActions, owned, regionsHeld, setsIn, type Action, type WarGame } from './engine';
import { MAP } from './map';

export type Style = 'general' | 'marshal';

/* ---------- exact battle odds ---------- */

/** Probabilities of (attacker losses, defender losses) for one roll of a vs d dice. */
function rollOdds(a: number, d: number): Map<string, number> {
  const out = new Map<string, number>();
  const total = 6 ** (a + d);
  const dice = Array<number>(a + d).fill(1);
  for (let k = 0; k < total; k++) {
    let x = k;
    for (let i = 0; i < a + d; i++) {
      dice[i] = (x % 6) + 1;
      x = Math.floor(x / 6);
    }
    const A = dice.slice(0, a).sort((p, q) => q - p);
    const D = dice.slice(a).sort((p, q) => q - p);
    let la = 0;
    let ld = 0;
    for (let i = 0; i < Math.min(a, d); i++)
      if (A[i]! > D[i]!) ld++;
      else la++;
    const key = `${la},${ld}`;
    out.set(key, (out.get(key) ?? 0) + 1 / total);
  }
  return out;
}
const ODDS: Map<string, number>[][] = [1, 2, 3].map((a) => [1, 2].map((d) => rollOdds(a, d)));
const memo = new Map<number, number>();

/** Chance that `att` armies able to attack (armies beyond the one left behind) take `def`. */
export function winChance(att: number, def: number): number {
  if (def <= 0) return 1;
  if (att <= 0) return 0;
  if (att > 60 || def > 60) return att > def * 1.3 ? 0.99 : att < def * 0.7 ? 0.01 : 0.5;
  const key = att * 100 + def;
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  const o = ODDS[Math.min(3, att) - 1]![Math.min(2, def) - 1]!;
  let p = 0;
  for (const [k, pr] of o) {
    const [la, ld] = k.split(',').map(Number) as [number, number];
    p += pr * winChance(att - la, def - ld);
  }
  memo.set(key, p);
  return p;
}

/* ---------- helpers ---------- */

const enemyNeighbours = (g: WarGame, p: number, t: number) =>
  MAP.territories[t]!.adj.filter((u) => g.owner[u] !== p);
const threat = (g: WarGame, p: number, t: number) =>
  enemyNeighbours(g, p, t).reduce((a, u) => a + g.armies[u]!, 0);
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

/** The landmass p should work on: most of it held, fewest enemy armies left, best bonus. */
function targetRegion(g: WarGame, p: number, style: Style): number {
  return bestBy(
    MAP.regions.map((_, i) => i),
    (i) => {
      const r = MAP.regions[i]!;
      const mine = r.members.filter((t) => g.owner[t] === p).length;
      if (mine === r.members.length) return -1e9;
      const foes = r.members.filter((t) => g.owner[t] !== p).reduce((a, t) => a + g.armies[t]!, 0);
      const frac = mine / r.members.length;
      return style === 'marshal'
        ? (r.bonus * (0.4 + frac)) / (foes + r.members.length - mine) + frac
        : frac * 10 - foes * 0.1;
    },
  )!;
}

/** What taking territory t is worth to p (in armies). */
function gain(g: WarGame, p: number, t: number, style: Style): number {
  const def = g.owner[t]!;
  const reg = MAP.regions[MAP.territories[t]!.region]!;
  let v = 1;
  const after = reg.members.every((u) => u === t || g.owner[u] === p);
  if (after) v += reg.bonus * (style === 'marshal' ? 2.5 : 2);
  // Breaking a landmass someone holds whole.
  if (reg.members.every((u) => g.owner[u] === def)) v += reg.bonus * 1.5;
  if (!g.conquered) v += style === 'marshal' ? 3 : 2;
  if (g.owner.filter((o) => o === def).length === 1) v += 4 + 3 * g.hands[def]!.length;
  if (style === 'marshal') {
    const mine = reg.members.filter((u) => g.owner[u] === p).length / reg.members.length;
    v += mine * 2;
  }
  return v;
}

/* ---------- decisions ---------- */

export function decide(g: WarGame, style: Style, rng: Rng): Action {
  const p = g.turn;
  const ph = g.phase;
  const legal = legalActions(g);
  const mine = owned(g, p);
  const target = targetRegion(g, p, style);
  const jitter = () => rng.float() * 0.001;

  // Where a new army helps most: a front of the target landmass, weighed by threat.
  const front = () =>
    bestBy(mine, (t) => {
      const foes = enemyNeighbours(g, p, t);
      if (!foes.length) return -1e6 + g.armies[t]!;
      const inTarget = foes.some((u) => MAP.territories[u]!.region === target) ? 6 : 0;
      const held = regionsHeld(g, p).includes(MAP.territories[t]!.region) ? 3 : 0;
      const pressure = threat(g, p, t) - g.armies[t]!;
      return style === 'marshal'
        ? inTarget + held + pressure * 0.3 + jitter()
        : inTarget + pressure * 0.1 + jitter();
    })!;

  // Where reinforcements unlock the most valuable attack this turn.
  const strike = (extra: number) =>
    bestBy(mine, (t) => {
      const foes = enemyNeighbours(g, p, t);
      if (!foes.length) return -1e6;
      return (
        Math.max(
          ...foes.map(
            (u) => gain(g, p, u, style) * winChance(g.armies[t]! - 1 + extra, g.armies[u]!),
          ),
        ) + jitter()
      );
    })!;

  switch (ph.k) {
    case 'over':
      throw new Error('Game over');
    case 'setup':
      return { t: 'place', at: front() };
    case 'reinforce': {
      const trade = legal.find((a) => a.t === 'trade');
      if (trade) {
        // Prefer a set showing territories we hold (2 extra armies).
        const sets = setsIn(g.hands[p]!);
        const best = bestBy(
          sets,
          (s) =>
            (s.some((c) => c < MAP.territories.length && g.owner[c] === p) ? 1 : 0) -
            s.filter((c) => c >= MAP.territories.length).length * 0.5,
        )!;
        return { t: 'trade', cards: best };
      }
      if (style === 'marshal' && ph.left > 0) return { t: 'place', at: strike(ph.left) };
      return { t: 'place', at: front() };
    }
    case 'attack': {
      const attacks = legal.filter((a) => a.t === 'attack') as Extract<Action, { t: 'attack' }>[];
      const full = attacks.filter((a) => a.dice === Math.min(3, g.armies[a.from]! - 1));
      const scored = full.map((a) => {
        const pw = winChance(g.armies[a.from]! - 1, g.armies[a.to]!);
        const value = gain(g, p, a.to, style);
        const cost =
          style === 'marshal'
            ? (1 - pw) * (g.armies[a.from]! - 1) * 0.35 + g.armies[a.to]! * 0.25
            : 0;
        return { a, pw, ev: pw * value - cost };
      });
      const ok = scored.filter((s) =>
        style === 'marshal' ? s.pw >= 0.55 && s.ev > 0.4 : s.pw >= 0.65,
      );
      const pick = bestBy(
        ok,
        (s) =>
          (style === 'marshal'
            ? s.ev
            : s.pw + (MAP.territories[s.a.to]!.region === target ? 0.2 : 0)) + jitter(),
      );
      return pick ? pick.a : { t: 'endAttack' };
    }
    case 'advance':
      // Into a territory with enemies around, everything goes forward (splitting stacks loses
      // more battles than it saves); into a safe pocket, the minimum.
      return { t: 'advance', n: threat(g, p, ph.to) ? ph.max : ph.min };
    case 'fortify': {
      // Move the biggest idle stack to its neighbour facing the most threat.
      const moves = mine
        .filter((t) => g.armies[t]! > 1 && !enemyNeighbours(g, p, t).length)
        .flatMap((from) =>
          MAP.territories[from]!.adj.filter((to) => g.owner[to] === p).map((to) => ({
            from,
            to,
            v:
              g.armies[from]! * (threat(g, p, to) > 0 ? 2 : 1) +
              (style === 'marshal' ? threat(g, p, to) * 0.2 : 0),
          })),
        );
      const best = bestBy(moves, (m) => m.v + jitter());
      if (best) return { t: 'fortify', from: best.from, to: best.to, n: g.armies[best.from]! - 1 };
      return { t: 'end' };
    }
  }
}

class WarAgent implements Agent<WarGame, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<WarGame, Action>, g: WarGame, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<WarGame, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'general',
    kind: 'heuristic',
    label: { en: 'General', es: 'General' },
    description: {
      en: 'Builds on the landmass it nearly holds and attacks at good odds.',
      es: 'Se centra en el continente que casi domina y ataca con buenas probabilidades.',
    },
    create: () => new WarAgent('general', 'General', 'general'),
  },
  {
    id: 'marshal',
    kind: 'heuristic',
    label: { en: 'Marshal', es: 'Mariscal' },
    description: {
      en: 'Weighs exact battle odds against what each conquest is worth — bonuses, cards, knock-outs — and guards its borders.',
      es: 'Sopesa las probabilidades exactas de cada batalla frente a lo que vale cada conquista —bonos, cartas, eliminaciones— y guarda sus fronteras.',
    },
    create: () => new WarAgent('marshal', 'Marshal', 'marshal'),
  },
];
