/**
 * The AI environment: a session of items (config `{ difficulty, topic, rule, rounds }`, default
 * six Normal items under the Closest rule). Action k guesses 10^(scale start + 0.02 k) in the
 * item's currency. The observation describes the item (category, currency, year, name) — never
 * its price.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import {
  current,
  guess,
  isSession,
  itemAt,
  newEndless,
  next,
  scale,
  type Difficulty,
  type PriceData,
  type Rule,
  type Session,
  type Topic,
} from './engine';
import raw from './items.json';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = raw as unknown as PriceData;
const STEP = 0.02;

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rule?: Rule;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  rule: Rule;
  id: string;
  category: string;
  currency: string;
  year: number;
  name: string;
  scale: [number, number];
}

export function observe(s: Session): Observation {
  const it = itemAt(DATA, current(s).item);
  return {
    round: s.count,
    total: s.total,
    rule: s.rule,
    id: it.id,
    category: it.category,
    currency: it.currency,
    year: it.year,
    name: it.name.en,
    scale: scale(DATA, it),
  };
}

const steps = (sc: [number, number]) => Math.round((sc[1] - sc[0]) / STEP);
export const actionValue = (sc: [number, number], a: number) => Math.pow(10, sc[0] + STEP * a);
const nearest = (sc: [number, number], v: number) =>
  Math.max(0, Math.min(steps(sc), Math.round((Math.log10(v) - sc[0]) / STEP)));

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'price-check',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: true,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newEndless(
      DATA,
      seed >>> 0,
      c?.difficulty ?? 'normal',
      c?.topic ?? 'all',
      c?.rule ?? 'closest',
      new Set(),
      c?.rounds ?? 6,
    ),
  reset: (seed) => newEndless(DATA, seed >>> 0, 'normal', 'all', 'closest', new Set(), 6),
  getObservation: (s) => observe(s),
  getLegalActions: (s) =>
    done(s) ? [] : Array.from({ length: steps(observe(s).scale) + 1 }, (_, i) => i),
  applyAction: (s, a) => {
    if (done(s)) throw new IllegalActionError('The session is over');
    const sc = observe(s).scale;
    if (!Number.isInteger(a) || a < 0 || a > steps(sc))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const n = guess(s, DATA, actionValue(sc, a));
    return n.status === 'done' ? n : next(n, DATA);
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Price Check session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => `guess#${a}`,
};

/** Distinctive lower-case words of a name (3+ letters, not pure numbers). */
const tokens = (name: string) =>
  name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !['the', 'and', 'for', 'with'].includes(w));

const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : NaN;
};

/**
 * A price estimate from other items only: the median of the same category and currency, the
 * item itself left out; with `similar`, the median of up to five same-category items sharing
 * words of its name.
 * Under “don't go over”, it shades the estimate down by 20 %.
 */
export function estimate(o: Observation, similarNames: boolean): number {
  const same = DATA.items.filter(
    (x) => x[0] !== o.id && x[1] === o.category && x[2] === o.currency,
  );
  // Similar products: same-category items sharing words of the name (a camera line, a console
  // family…), the closest in year first; falls back to the category median. (Year alone and
  // consumer-price inflation both predicted worse than the plain median on this data.)
  let m = median(same.map((x) => x[3]));
  if (similarNames) {
    const words = tokens(o.name);
    const similar = same
      .map((x) => ({ x, shared: tokens(x[5]).filter((w) => words.includes(w)).length }))
      .filter((s) => s.shared > 0)
      .sort((a, b) => b.shared - a.shared || Math.abs(a.x[4] - o.year) - Math.abs(b.x[4] - o.year))
      .slice(0, 5);
    if (similar.length >= 2) m = median(similar.map((s) => s.x[3]));
  }
  const v = Number.isFinite(m) ? m : Math.pow(10, (o.scale[0] + o.scale[1]) / 2);
  return o.rule === 'under' ? v * 0.8 : v;
}

class Estimator implements Agent<Session, number> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly similar: boolean,
  ) {}
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    return nearest(o.scale, estimate(o, this.similar));
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any price on the scale.', es: 'Cualquier precio de la escala.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'category',
    kind: 'heuristic',
    label: { en: 'Typical for its kind', es: 'Lo típico de su clase' },
    description: {
      en: 'Guesses the median price of other items of the same category and currency.',
      es: 'Estima la mediana de otros artículos de la misma categoría y moneda.',
    },
    create: () => new Estimator('category', 'Typical for its kind', false),
  },
  {
    id: 'similar',
    kind: 'heuristic',
    label: { en: 'Similar products', es: 'Productos parecidos' },
    description: {
      en: 'Prices it like same-category items that share words of its name (a camera line, a console family), else like its category.',
      es: 'Le pone el precio de artículos de su categoría que comparten palabras del nombre (una gama de cámaras, una familia de consolas) o, si no, el de su categoría.',
    },
    create: () => new Estimator('similar', 'Similar products', true),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
