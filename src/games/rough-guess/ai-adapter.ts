/**
 * The AI environment: a session of questions (config `{ difficulty, topic, rounds }`, default
 * ten Normal questions). An action is a range on the question's log scale: action = 9 × k + w,
 * centre = domain start + 0.125·k orders, width = WIDTHS[w] orders; legal when the range stays on
 * the scale. Observations show the question, never its answer.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import mag from '../order-of-magnitude/questions.json';
import rough from './data.json';
import {
  answer,
  current,
  domain,
  greatCircleKm,
  isSession,
  newEndless,
  next,
  question,
  type Bank,
  type Difficulty,
  type Kind,
  type Session,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const BANK = { rough, mag } as unknown as Bank;
export const WIDTHS = [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2];
const STEP = 0.125;

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rounds?: number;
}

export interface Observation {
  round: number;
  total: number;
  hits: number;
  key: string;
  kind: Kind;
  subject: string;
  year: number;
  /** The scale, log10. */
  domain: [number, number];
}

export function observe(s: Session): Observation {
  const q = question(BANK, current(s).key);
  return {
    round: s.count,
    total: s.total,
    hits: s.hits,
    key: q.key,
    kind: q.kind,
    subject: q.subject.en,
    year: q.year,
    domain: domain(BANK, q),
  };
}

export function actionRange(d: [number, number], a: number): [number, number] {
  const c = d[0] + STEP * Math.floor(a / WIDTHS.length);
  const w = WIDTHS[a % WIDTHS.length]!;
  return [Math.pow(10, c - w / 2), Math.pow(10, c + w / 2)];
}
function legal(d: [number, number]): number[] {
  const out: number[] = [];
  const n = Math.floor((d[1] - d[0]) / STEP);
  for (let k = 0; k <= n; k++)
    WIDTHS.forEach((w, wi) => {
      const c = d[0] + STEP * k;
      if (c - w / 2 >= d[0] - 1e-9 && c + w / 2 <= d[1] + 1e-9) out.push(k * WIDTHS.length + wi);
    });
  return out;
}

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'rough-guess',
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
      BANK,
      seed >>> 0,
      c?.difficulty ?? 'normal',
      c?.topic ?? 'all',
      new Set(),
      c?.rounds ?? 10,
    ),
  reset: (seed) => newEndless(BANK, seed >>> 0, 'normal', 'all', new Set(), 10),
  getObservation: (s) => observe(s),
  getLegalActions: (s) => (done(s) ? [] : legal(observe(s).domain)),
  applyAction: (s, a) => {
    if (done(s)) throw new IllegalActionError('The session is over');
    const d = observe(s).domain;
    if (!legal(d).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
    const [lo, hi] = actionRange(d, a);
    const n = answer(s, BANK, lo, hi);
    return n.status === 'done' ? n : next(n, BANK);
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, BANK)) throw new Error('Invalid Rough Guess session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => `range#${a}`,
};

/* ---------- prior knowledge: typical value and spread of each kind ---------- */

const priorCache = new Map<string, { mean: number; sd: number }>();
/** Mean and standard deviation of log10 values of the question's family (its own value left out). */
export function prior(key: string): { mean: number; sd: number } {
  const q = question(BANK, key);
  const id = q.kind === 'price' ? `price:${q.ref}` : q.kind;
  const own = Math.log10(q.value);
  let base = priorCache.get(id);
  if (!base || q.kind !== 'distance') {
    let values: number[];
    if (q.kind === 'price') {
      const ci = BANK.rough.commodities.findIndex((c) => c[0] === q.ref);
      values = BANK.rough.prices.filter((p) => p[0] === ci).map((p) => Math.log10(p[2]));
    } else if (q.kind === 'distance') {
      const c = BANK.rough.cities;
      values = [];
      for (let i = 0; i < c.length; i += 3)
        for (let j = i + 1; j < c.length; j += 7)
          values.push(
            Math.log10(Math.max(1, greatCircleKm([c[i]![3], c[i]![4]], [c[j]![3], c[j]![4]]))),
          );
    } else if (['melting', 'boiling', 'density', 'atomic-mass'].includes(q.kind)) {
      const col = { melting: 4, boiling: 5, density: 6, 'atomic-mass': 7 }[q.kind as 'melting'];
      values = BANK.rough.elements
        .map((e) => e[col] as number)
        .filter((v) => v > 0)
        .map(Math.log10);
    } else values = BANK.mag.questions.filter((m) => m[1] === q.kind).map((m) => Math.log10(m[2]));
    // Leave the question's own value out (distances are sampled, so nothing to remove).
    if (q.kind !== 'distance') {
      const i = values.findIndex((v) => Math.abs(v - own) < 1e-12);
      if (i >= 0) values.splice(i, 1);
    }
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
    base = { mean, sd: Math.max(0.05, sd) };
    if (q.kind === 'distance') priorCache.set(id, base);
  }
  return base;
}

/** erf by Abramowitz–Stegun 7.1.26 (|error| < 1.5e-7). */
function erf(x: number): number {
  const s = Math.sign(x);
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return s * y;
}

/** Expected score of a range of width w centred on the prior mean, if errors are normal(0, sd). */
export const expectedScore = (w: number, sd: number) =>
  erf(w / 2 / (sd * Math.SQRT2)) * Math.max(10, 100 * (1 - w / 2));

/** Centres on its prior and picks the width with the best expected score. */
class Calibrated implements Agent<Session, number> {
  readonly id = 'calibrated';
  readonly label = 'Calibrated';
  selectAction(_e: GameEnvironment<Session, number>, s: Session, _p: number, _c: DecisionContext) {
    const o = observe(s);
    const { mean, sd } = prior(o.key);
    let best = 0;
    let bestScore = -1;
    for (const a of legal(o.domain)) {
      const [lo, hi] = actionRange(o.domain, a);
      const c = Math.log10(Math.sqrt(lo * hi));
      const w = Math.log10(hi / lo);
      // Probability mass of normal(mean, sd) inside [c − w/2, c + w/2].
      const p =
        0.5 *
        (erf((c + w / 2 - mean) / (sd * Math.SQRT2)) - erf((c - w / 2 - mean) / (sd * Math.SQRT2)));
      const score = p * Math.max(10, 100 * (1 - w / 2));
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }
}

/** Always answers with the widest legal range around the scale's middle. */
class Widest implements Agent<Session, number> {
  readonly id = 'widest';
  readonly label = 'Widest';
  selectAction(e: GameEnvironment<Session, number>, s: Session) {
    const acts = e.getLegalActions(s);
    let best = acts[0]!;
    let bw = -1;
    const d = observe(s).domain;
    const mid = (d[0] + d[1]) / 2;
    for (const a of acts) {
      const [lo, hi] = actionRange(d, a);
      const w = Math.log10(hi / lo) - Math.abs(Math.log10(Math.sqrt(lo * hi)) - mid) * 0.01;
      if (w > bw) {
        bw = w;
        best = a;
      }
    }
    return best;
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any range on the scale.', es: 'Cualquier rango de la escala.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'widest',
    kind: 'heuristic',
    label: { en: 'Play it safe', es: 'Sobre seguro' },
    description: {
      en: 'Always the widest range: rarely wrong, never worth much.',
      es: 'Siempre el rango más ancho: casi nunca falla y casi nunca puntúa.',
    },
    create: () => new Widest(),
  },
  {
    id: 'calibrated',
    kind: 'search',
    label: { en: 'Calibrated', es: 'Calibrado' },
    description: {
      en: 'Knows the typical value and spread of each kind of question and picks the range with the best expected score.',
      es: 'Conoce el valor típico y la dispersión de cada tipo de pregunta y elige el rango con mejor puntuación esperada.',
    },
    create: () => new Calibrated(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
