/**
 * The AI environment: a session of boards (config `{ difficulty, topic, boards }`, default three
 * Normal boards). Action f·7+n places number n on fact f; CHECK (35) checks the board.
 * Observations hold the facts (keys, so agents can reason about what each fact is — never its
 * value), the seven numbers, the placements, locks, known-wrong pairings and checks used.
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
import { expertPrior } from '../closest-call/beliefs';
import mag from '../order-of-magnitude/questions.json';
import rough from '../rough-guess/data.json';
import { question, type Bank, type QKey } from '../rough-guess/engine';
import {
  boardOver,
  checkIn,
  current,
  FACTS,
  isSession,
  newEndless,
  next,
  NUMBERS,
  placeIn,
  type Difficulty,
  type Session,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const BANK = { rough, mag } as unknown as Bank;
export const CHECK = FACTS * NUMBERS;

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  boards?: number;
}
export interface Observation {
  board: number;
  total: number;
  family: string;
  facts: QKey[];
  numbers: number[];
  placement: (number | null)[];
  locked: boolean[];
  wrong: number[];
  checks: number;
}

export function observe(s: Session): Observation {
  const b = current(s);
  return {
    board: s.count,
    total: s.total,
    family: b.family,
    facts: [...b.facts],
    numbers: [...b.values],
    placement: [...b.placement],
    locked: b.locked.map((l) => l > 0),
    wrong: [...b.wrong],
    checks: b.checks,
  };
}

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

function legal(s: Session): number[] {
  if (done(s)) return [];
  const b = current(s);
  const lockedNumbers = new Set(b.placement.filter((p, f) => p !== null && b.locked[f]));
  const out: number[] = [];
  for (let f = 0; f < FACTS; f++) {
    if (b.locked[f]) continue;
    for (let n = 0; n < NUMBERS; n++)
      if (!lockedNumbers.has(n) && b.placement[f] !== n) out.push(f * NUMBERS + n);
  }
  if (b.placement.some((p, f) => p !== null && !b.locked[f])) out.push(CHECK);
  return out;
}

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'fact-match',
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
      c?.boards ?? 3,
    ),
  reset: (seed) => newEndless(BANK, seed >>> 0, 'normal', 'all', new Set(), 3),
  getObservation: (s) => observe(s),
  getLegalActions: legal,
  applyAction: (s, a) => {
    if (!legal(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
    const n = a === CHECK ? checkIn(s) : placeIn(s, Math.floor(a / NUMBERS), a % NUMBERS);
    return n.status === 'playing' && boardOver(current(n)) ? next(n, BANK) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, BANK)) throw new Error('Invalid Fact Match session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) =>
    a === CHECK ? 'check' : `fact ${Math.floor(a / NUMBERS) + 1} ← number ${(a % NUMBERS) + 1}`,
};

/* ---------- agents ---------- */

/**
 * The best assignment of numbers to the unlocked facts: minimises Σ cost[f][n] over one-to-one
 * assignments, never using a known-wrong pairing or a locked number (exhaustive: at most 7P5).
 */
export function bestAssignment(
  o: Observation,
  cost: (f: number, n: number) => number,
): (number | null)[] {
  const open = o.facts.map((_, f) => f).filter((f) => !o.locked[f]);
  const used = new Set(o.placement.filter((p, f) => p !== null && o.locked[f]) as number[]);
  const wrong = new Set(o.wrong);
  let best: number[] | null = null;
  let bestCost = Infinity;
  const pick: number[] = [];
  const go = (k: number, acc: number) => {
    if (acc >= bestCost) return;
    if (k === open.length) {
      best = [...pick];
      bestCost = acc;
      return;
    }
    const f = open[k]!;
    for (let n = 0; n < NUMBERS; n++) {
      if (used.has(n) || wrong.has(f * NUMBERS + n)) continue;
      used.add(n);
      pick.push(n);
      go(k + 1, acc + cost(f, n));
      pick.pop();
      used.delete(n);
    }
  };
  go(0, 0);
  const out: (number | null)[] = o.facts.map((_, f) => (o.locked[f] ? o.placement[f]! : null));
  (best as number[] | null)?.forEach((n, k) => (out[open[k]!] = n));
  return out;
}

/** Places the plan one fact at a time, then checks. */
function act(o: Observation, plan: (number | null)[]): number {
  for (let f = 0; f < FACTS; f++) {
    const n = plan[f];
    if (!o.locked[f] && n !== null && n !== undefined && o.placement[f] !== n)
      return f * NUMBERS + n;
  }
  return CHECK;
}

/** Cost from estimated log values: squared distance in log10 space, scaled by the estimate's spread. */
function fromEstimates(o: Observation, est: { mean: number; sd: number }[]) {
  return (f: number, n: number) => {
    const z = (Math.log10(o.numbers[n]!) - est[f]!.mean) / est[f]!.sd;
    return z * z;
  };
}

/** Ranker: the order of the facts by year (prices) or fame (everything else) should match the order of the numbers. */
class Ranker implements Agent<Session, number> {
  readonly id = 'ranker';
  readonly label = 'Ranker';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    const qs = o.facts.map((k) => question(BANK, k));
    const key = (f: number) => (o.family.startsWith('p:') ? qs[f]!.year : qs[f]!.fame);
    const factRank = o.facts.map(
      (_, f) => o.facts.filter((__, g) => key(g) < key(f)).length / (FACTS - 1),
    );
    const sorted = [...o.numbers].sort((a, b) => a - b);
    // The middle five numbers are the likeliest answers; spread the facts' ranks over them.
    const numRank = o.numbers.map((v) => (sorted.indexOf(v) - 1) / (FACTS - 1));
    return act(
      o,
      bestAssignment(o, (f, n) => (factRank[f]! - numRank[n]!) ** 2),
    );
  }
}

/**
 * Expert: estimates each fact from related knowledge — neighbouring years of the same price,
 * neighbouring elements in the periodic table, a rough map reading for distances (degrees apart,
 * as the crow flies on a flat map), the family's typical value otherwise — and solves the best
 * assignment under everything the checks have ruled out.
 */
export function estimate(key: QKey): { mean: number; sd: number } {
  if (key.startsWith('d:')) {
    const [, a, b] = key.split(':').map(Number);
    const x = BANK.rough.cities[a!]!;
    const y = BANK.rough.cities[b!]!;
    const deg =
      Math.abs(x[3] - y[3]) + Math.min(Math.abs(x[4] - y[4]), 360 - Math.abs(x[4] - y[4]));
    return { mean: Math.log10(Math.max(50, deg * 90)), sd: 0.2 };
  }
  const p = expertPrior(BANK, key);
  // Within a world-fact family the typical value is the same for every fact: fame breaks the tie
  // (better-known places tend to be bigger).
  if (key.startsWith('m:'))
    return { mean: p.mean + 0.15 * Math.log10(question(BANK, key).fame / 50), sd: p.sd };
  return p;
}
class Expert implements Agent<Session, number> {
  readonly id = 'expert';
  readonly label = 'Expert';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    return act(o, bestAssignment(o, fromEstimates(o, o.facts.map(estimate))));
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Random placements and checks.',
      es: 'Colocaciones y comprobaciones al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'ranker',
    kind: 'heuristic',
    label: { en: 'Ranker', es: 'Ordenador' },
    description: {
      en: 'Assumes later years and better-known places have bigger numbers, and respects every cross.',
      es: 'Supone que los años más recientes y los lugares más conocidos tienen números mayores, y respeta cada cruz.',
    },
    create: () => new Ranker(),
  },
  {
    id: 'expert',
    kind: 'search',
    label: { en: 'Expert', es: 'Experto' },
    description: {
      en: 'Estimates each fact from related knowledge and solves the best one-to-one assignment.',
      es: 'Estima cada dato con conocimientos relacionados y resuelve la mejor asignación uno a uno.',
    },
    create: () => new Expert(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
