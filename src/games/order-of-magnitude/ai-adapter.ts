/**
 * The AI environment: a session of questions (config `{ difficulty, topic, rounds }`, default
 * five Normal questions). Actions 0–95 guess M × 10^e with M ∈ {1, 1.5, 2, 3, 5, 7} and
 * e ∈ 0…15 (action = 6e + index of M); action 96 locks the last guess in. Observations show the
 * question and the feedback for each guess — never the answer.
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
import {
  canGuess,
  canLock,
  current,
  feasible,
  feedback,
  guess,
  isSession,
  lock,
  newEndless,
  next,
  questionAt,
  toSci,
  type Difficulty,
  type Feedback,
  type Kind,
  type MagnitudeData,
  type Session,
  type Topic,
} from './engine';
import raw from './questions.json';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const DATA = raw as unknown as MagnitudeData;
const MANT = [1, 1.5, 2, 3, 5, 7];
export const LOCK = 96;
export const actionValue = (a: number) => MANT[a % 6]! * Math.pow(10, Math.floor(a / 6));

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rounds?: number;
}

export interface Observation {
  round: number;
  total: number;
  id: string;
  kind: Kind;
  subject: string;
  year: number;
  guesses: { value: number; feedback: Feedback }[];
}

export function observe(s: Session): Observation {
  const r = current(s);
  const q = questionAt(DATA, r.q);
  return {
    round: s.count,
    total: s.total,
    id: q.id,
    kind: q.kind,
    subject: q.subject.en,
    year: q.year,
    guesses: r.guesses.map((value) => ({ value, feedback: feedback(value, q.value) })),
  };
}

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'order-of-magnitude',
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
      new Set(),
      c?.rounds ?? 5,
    ),
  reset: (seed) => newEndless(DATA, seed >>> 0, 'normal', 'all', new Set(), 5),
  getObservation: (s) => observe(s),
  getLegalActions: (s) => {
    if (done(s)) return [];
    const out: number[] = [];
    if (canGuess(s)) for (let a = 0; a < 96; a++) out.push(a);
    if (canLock(s)) out.push(LOCK);
    return out;
  },
  applyAction: (s, a) => {
    if (done(s)) throw new IllegalActionError('The session is over');
    let n: Session;
    if (a === LOCK) {
      if (!canLock(s)) throw new IllegalActionError('Nothing to lock in');
      n = lock(s, DATA);
    } else {
      if (!Number.isInteger(a) || a < 0 || a > 95 || !canGuess(s))
        throw new IllegalActionError(`Illegal action ${String(a)}`);
      n = guess(s, DATA, toSci(actionValue(a)));
    }
    return n.status === 'playing' && current(n).locked ? next(n, DATA) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Order of Magnitude session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => (a === LOCK ? 'lock' : `${actionValue(a)}`),
};

/** Typical value of each kind of question (median), used as an informed first guess. */
const byKind = new Map<Kind, { id: string; v: number }[]>();
for (const [id, kind, v] of DATA.questions) {
  const l = byKind.get(kind);
  if (l) l.push({ id, v });
  else byKind.set(kind, [{ id, v }]);
}
for (const l of byKind.values()) l.sort((a, b) => a.v - b.v);
export function typical(kind: Kind, excludeId: string): number {
  const l = (byKind.get(kind) ?? []).filter((x) => x.id !== excludeId);
  return l[Math.floor(l.length / 2)]?.v ?? 1e6;
}

const nearestAction = (logV: number) => {
  let best = 0;
  let bestD = Infinity;
  for (let a = 0; a < 96; a++) {
    const d = Math.abs(Math.log10(actionValue(a)) - logV);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
};

/** Narrows the feasible interval guess by guess (optionally from the typical value); locks when hot. */
class Narrower implements Agent<Session, number> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly informed: boolean,
  ) {}
  selectAction(_e: GameEnvironment<Session, number>, s: Session, _p: number, _c: DecisionContext) {
    const o = observe(s);
    const last = o.guesses[o.guesses.length - 1];
    if (last && (last.feedback.band === 'hot' || last.feedback.band === 'exact') && canLock(s))
      return LOCK;
    if (!o.guesses.length && this.informed) return nearestAction(Math.log10(typical(o.kind, o.id)));
    const [lo, hi] = feasible(o.guesses);
    return nearestAction((lo + hi) / 2);
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any guess, any time.', es: 'Cualquier estimación, en cualquier momento.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'bisect',
    kind: 'search',
    label: { en: 'Bisector', es: 'Bisector' },
    description: {
      en: 'Knows nothing about the world: halves the range the feedback allows.',
      es: 'No sabe nada del mundo: parte por la mitad el rango que permiten las pistas.',
    },
    create: () => new Narrower('bisect', 'Bisector', false),
  },
  {
    id: 'informed',
    kind: 'heuristic',
    label: { en: 'Informed', es: 'Informado' },
    description: {
      en: 'Starts from the typical value of this kind of question, then narrows with the feedback.',
      es: 'Empieza por el valor típico de ese tipo de pregunta y luego afina con las pistas.',
    },
    create: () => new Narrower('informed', 'Informed', true),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
