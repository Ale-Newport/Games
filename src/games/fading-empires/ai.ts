/**
 * Fading Empires computer players. Everything in the game is public except the generator (die and
 * deck order), which they never read.
 *
 * - Raider: picks the pairing with the most bands for its coins, takes the cheapest regions it can,
 *   tries the die when one band short, spreads its bands evenly, declines when it can no longer
 *   expand.
 * - Warlord: values pairings by the coins they should earn over the rounds left (bands, bonus
 *   regions on the map, coins on the pairing), takes regions by worth per band (coins, bonuses,
 *   hurting the leader), keeps bands where enemies are strong, and declines when a fresh empire
 *   would earn more than the tired one.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { activeRegions, cost, legalActions, targets, type Action, type Fading } from './engine';
import { PEOPLES, REGIONS, TRAITS } from './world';

export type Style = 'raider' | 'warlord';

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

/** Extra coins a region earns its holder each turn under a pairing. */
function bonus(people: number, trait: number, r: number): number {
  const reg = REGIONS[r]!;
  const pe = PEOPLES[people]!.id;
  const tr = TRAITS[trait]!.id;
  let b = 0;
  if (pe === 'stonefolk' && reg.terrain === 'hills') b++;
  if (pe === 'riverkin' && reg.shore) b++;
  if (pe === 'ashborn' && reg.feature === 'mine') b++;
  if (pe === 'seers' && reg.feature === 'spring') b++;
  if (tr === 'highland' && (reg.terrain === 'hills' || reg.terrain === 'mountain')) b++;
  if (tr === 'woodland' && reg.terrain === 'forest') b++;
  if (tr === 'farming' && reg.terrain === 'farmland') b++;
  return b;
}

/** The warlord's estimate of what a pairing earns over the rounds left. */
function comboWorth(g: Fading, i: number): number {
  const c = g.row[i]!;
  const bands = PEOPLES[c.people]!.bands + TRAITS[c.trait]!.bands;
  const left = g.rounds - g.round + 1;
  const regions = bands / 2.8;
  const land = REGIONS.map((_, r) => r).filter((r) => REGIONS[r]!.terrain !== 'lake');
  const density = land.reduce((a, r) => a + bonus(c.people, c.trait, r), 0) / land.length;
  let v = regions * (1 + density) * Math.min(left, 3.5) + c.coins - i;
  if (TRAITS[c.trait]!.id === 'wealthy') v += 7;
  if (PEOPLES[c.people]!.id === 'skyriders') v += 2;
  if (TRAITS[c.trait]!.id === 'fierce') v += regions * 0.8;
  return v;
}

/** Bands the empire could march with (all but one on each region, plus the hand). */
const marchable = (g: Fading, p: number) =>
  g.ps[p]!.hand + activeRegions(g, p).reduce((a, r) => a + g.bands[r]! - 1, 0);

export function decide(g: Fading, style: Style, rng: Rng): Action {
  const p = g.turn;
  const me = g.ps[p]!;
  const ph = g.phase;
  const legal = legalActions(g);
  const jitter = () => rng.float() * 0.001;
  const leader = bestBy(
    g.ps.map((_, q) => q).filter((q) => q !== p),
    (q) => g.ps[q]!.coins,
  )!;
  const lastRound = g.round === g.rounds;

  switch (ph.k) {
    case 'over':
      throw new Error('Game over');
    case 'pick': {
      const picks = legal as { t: 'pick'; i: number }[];
      return bestBy(picks, ({ i }) => {
        const c = g.row[i]!;
        if (style === 'raider')
          return PEOPLES[c.people]!.bands + TRAITS[c.trait]!.bands + c.coins - i * 1.2 + jitter();
        return comboWorth(g, i) + jitter();
      })!;
    }
    case 'start': {
      const spare = marchable(g, p);
      if (!lastRound && me.active) {
        if (style === 'raider' && spare < 3) return { t: 'decline' };
        if (style === 'warlord') {
          // Spent: fewer than three spare bands, or nothing within reach — a fresh empire next
          // turn earns more (measured: declining later loses about a fifth of the games won).
          const reach = targets({ ...g, phase: { k: 'conquer', taken: 0, heldTaken: 0 } }, p)
            .map((r) => cost(g, p, r))
            .filter((c) => c <= spare);
          if (spare < 3 || reach.length === 0) return { t: 'decline' };
        }
      }
      return { t: 'march' };
    }
    case 'conquer': {
      const takes = legal.filter((a) => a.t === 'take') as { t: 'take'; r: number }[];
      if (takes.length) {
        return bestBy(takes, ({ r }) => {
          const c = cost(g, p, r);
          if (style === 'raider') return -c + jitter();
          const e = me.active!;
          const h = g.holds[r];
          let v = 1 + bonus(e.people, e.trait, r);
          if (h && h.p === leader && !h.declined) v += 0.6;
          if (h && h.p !== p) v += 0.2;
          if (REGIONS[r]!.border) v -= 0.1;
          return v / c + jitter();
        })!;
      }
      const gambles = legal.filter((a) => a.t === 'gamble') as { t: 'gamble'; r: number }[];
      const short = (r: number) => cost(g, p, r) - me.hand;
      const ok = gambles.filter(
        ({ r }) => short(r) <= (TRAITS[me.active!.trait]!.id === 'lucky' ? 2 : 1),
      );
      if (ok.length) return bestBy(ok, ({ r }) => -short(r) + jitter())!;
      return { t: 'stop' };
    }
    case 'redeploy': {
      const places = legal.filter((a) => a.t === 'place') as { t: 'place'; r: number }[];
      if (places.length) {
        return bestBy(places, ({ r }) => {
          if (style === 'raider') return -g.bands[r]! + jitter();
          // Threat: enemy active bands next door, and the valley's edge.
          const threat = REGIONS[r]!.adj.reduce((a, x) => {
            const h = g.holds[x];
            return a + (h && h.p !== p && !h.declined ? g.bands[x]! + 2 : 0);
          }, 0);
          return (threat + (REGIONS[r]!.border ? 1 : 0)) / (g.bands[r]! + 1) + jitter();
        })!;
      }
      // Stalwart: decline now instead of next turn when the empire is spent.
      if (legal.some((a) => a.t === 'decline') && !lastRound && marchable(g, p) < 3)
        return { t: 'decline' };
      return { t: 'done' };
    }
  }
}

class FadingAgent implements Agent<Fading, Action> {
  constructor(
    readonly id: string,
    readonly label: string,
    private style: Style,
  ) {}
  selectAction(_e: GameEnvironment<Fading, Action>, g: Fading, _p: number, ctx: { rng: Rng }) {
    return decide(g, this.style, ctx.rng);
  }
}

export const RAW_PRESETS: AgentPreset<Fading, Action>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal move.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'raider',
    kind: 'heuristic',
    label: { en: 'Raider', es: 'Saqueador' },
    description: {
      en: 'Takes the most bands, grabs the cheapest regions and declines when it cannot expand.',
      es: 'Coge más bandas, toma las regiones más baratas y declina cuando no puede crecer.',
    },
    create: () => new FadingAgent('raider', 'Raider', 'raider'),
  },
  {
    id: 'warlord',
    kind: 'heuristic',
    label: { en: 'Warlord', es: 'Caudillo' },
    description: {
      en: 'Values pairings by the coins they should earn, takes regions by worth per band, guards its borders and declines at the right moment.',
      es: 'Valora las parejas por lo que deberían ganar, toma regiones por valor por banda, guarda sus fronteras y declina en el momento justo.',
    },
    create: () => new FadingAgent('warlord', 'Warlord', 'warlord'),
  },
];
