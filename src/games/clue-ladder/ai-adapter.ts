/**
 * The AI environment: a session of questions (config `{ difficulty, topic, rounds }`, default
 * five Normal questions). When a guess is due, action k guesses 10^(scale start + 0.02 k); after a
 * guess, action KEEP keeps it and CLIMB takes the next clue. Observations hold the clues revealed
 * so far and the banded feedback of earlier guesses — never the answer.
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
import { familyPrior } from '../closest-call/beliefs';
import mag from '../order-of-magnitude/questions.json';
import rough from '../rough-guess/data.json';
import { domain, question, type Bank } from '../rough-guess/engine';
import {
  canDecide,
  canGuess,
  climb,
  cluesFor,
  current,
  feedback,
  guess,
  isSession,
  keep,
  newEndless,
  next,
  RUNG_VALUE,
  type Band,
  type Clues,
  type Difficulty,
  type Feedback,
  type Session,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const BANK = { rough, mag } as unknown as Bank;
const STEP = 0.02;

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  key: string;
  kind: string;
  subject: string;
  rung: number;
  scale: [number, number];
  /** Clues revealed so far (rung ≥ 1 bracket, ≥ 2 digits, ≥ 3 leading digit, ≥ 4 window). */
  clues: Partial<Clues>;
  guesses: { value: number; feedback: Feedback }[];
}

export function observe(s: Session): Observation {
  const r = current(s);
  const q = question(BANK, r.key);
  const all = cluesFor(BANK, r.key, r.clueSeed);
  const clues: Partial<Clues> = {};
  if (r.rung >= 1) clues.bracket = all.bracket;
  if (r.rung >= 2) clues.digits = all.digits;
  if (r.rung >= 3) clues.leading = all.leading;
  if (r.rung >= 4) clues.window = all.window;
  return {
    round: s.count,
    total: s.total,
    key: q.key,
    kind: q.kind,
    subject: q.subject.en,
    rung: r.rung,
    scale: domain(BANK, q),
    clues,
    guesses: r.guesses.map((value) => ({ value, feedback: feedback(value, q.value) })),
  };
}

const steps = (sc: [number, number]) => Math.round((sc[1] - sc[0]) / STEP);
export const actionValue = (sc: [number, number], a: number) => Math.pow(10, sc[0] + STEP * a);
const nearest = (sc: [number, number], v: number) =>
  Math.max(0, Math.min(steps(sc), Math.round((Math.log10(v) - sc[0]) / STEP)));
/** Decision actions sit after the guess grid. */
export const KEEP = 100_000;
export const CLIMB = 100_001;

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'clue-ladder',
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
      c?.rounds ?? 5,
    ),
  reset: (seed) => newEndless(BANK, seed >>> 0, 'normal', 'all', new Set(), 5),
  getObservation: (s) => observe(s),
  getLegalActions: (s) => {
    if (done(s)) return [];
    if (canDecide(s)) return [KEEP, CLIMB];
    return Array.from({ length: steps(observe(s).scale) + 1 }, (_, i) => i);
  },
  applyAction: (s, a) => {
    if (done(s)) throw new IllegalActionError('The session is over');
    let n: Session;
    if (canDecide(s)) {
      if (a === KEEP) n = keep(s, BANK);
      else if (a === CLIMB) n = climb(s);
      else throw new IllegalActionError('Keep or climb');
    } else {
      const sc = observe(s).scale;
      if (!canGuess(s) || !Number.isInteger(a) || a < 0 || a > steps(sc))
        throw new IllegalActionError(`Illegal action ${String(a)}`);
      n = guess(s, BANK, actionValue(sc, a));
    }
    return n.status === 'playing' && current(n).kept !== null ? next(n, BANK) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, BANK)) throw new Error('Invalid Clue Ladder session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => (a === KEEP ? 'keep' : a === CLIMB ? 'climb' : `guess#${a}`),
};

/* ---------- the clue reasoner ---------- */

const BAND_RATIO: Record<Band, [number, number]> = {
  exact: [1, 1.02],
  hot: [1.02, 1.1],
  warm: [1.1, 1.25],
  near: [1.25, 1.5],
  far: [1.5, 3],
  way: [3, 1e9],
};

/** The range (log10) consistent with every clue and feedback so far. */
export function feasible(o: Observation): [number, number] {
  let [lo, hi] = o.scale;
  const cut = (a: number, b: number) => {
    lo = Math.max(lo, a);
    hi = Math.min(hi, b);
  };
  const c = o.clues;
  if (c.bracket?.below) cut(Math.log10(c.bracket.below.value), Infinity);
  if (c.bracket?.above) cut(-Infinity, Math.log10(c.bracket.above.value));
  if (c.digits !== undefined)
    cut(c.digits === 0 ? -Infinity : c.digits - 1, c.digits === 0 ? 0 : c.digits);
  if (c.leading !== undefined && c.digits !== undefined) {
    const e = c.digits === 0 ? Math.floor(lo) : c.digits - 1;
    cut(Math.log10(c.leading) + e, Math.log10(c.leading + 1) + e);
  }
  if (c.window) cut(Math.log10(c.window[0]), Math.log10(c.window[1]));
  for (const { value, feedback: f } of o.guesses) {
    const g = Math.log10(value);
    const [r0, r1] = BAND_RATIO[f.band].map(Math.log10) as [number, number];
    if (f.direction === 'higher') cut(g + r0, g + r1);
    else if (f.direction === 'lower') cut(g - r1, g - r0);
  }
  return lo <= hi ? [lo, hi] : [hi, lo];
}

/** Typical accuracy of the next guess after climbing to rung r + 1 (measured roughly). */
const NEXT_ACCURACY = [45, 55, 70, 88];
const BAND_ACCURACY: Record<Band, number> = {
  exact: 100,
  hot: 92,
  warm: 79,
  near: 62,
  far: 35,
  way: 9,
};

class Reasoner implements Agent<Session, number> {
  readonly id = 'reasoner';
  readonly label = 'Clue reasoner';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    if (canDecide(s)) {
      const last = o.guesses[o.guesses.length - 1]!;
      const keepValue = BAND_ACCURACY[last.feedback.band] * RUNG_VALUE[o.rung]!;
      const climbValue = NEXT_ACCURACY[o.rung]! * RUNG_VALUE[o.rung + 1]!;
      return keepValue >= climbValue ? KEEP : CLIMB;
    }
    const [lo, hi] = feasible(o);
    // Start from what is typical for the family, kept inside what the clues allow.
    const prior = familyPrior(BANK, o.key).mean;
    const target =
      o.rung === 0 && o.guesses.length === 0 ? Math.min(hi, Math.max(lo, prior)) : (lo + hi) / 2;
    return nearest(o.scale, Math.pow(10, target));
  }
}

class Climber implements Agent<Session, number> {
  readonly id = 'climber';
  readonly label = 'Always climb';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    if (canDecide(s)) return CLIMB;
    const [lo, hi] = feasible(o);
    return nearest(o.scale, Math.pow(10, (lo + hi) / 2));
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Random guesses and decisions.', es: 'Estimaciones y decisiones al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'climber',
    kind: 'heuristic',
    label: { en: 'Always climb', es: 'Siempre sube' },
    description: {
      en: 'Uses every clue before answering: always reaches the last rung.',
      es: 'Usa todas las pistas antes de responder: siempre llega al último peldaño.',
    },
    create: () => new Climber(),
  },
  {
    id: 'reasoner',
    kind: 'search',
    label: { en: 'Clue reasoner', es: 'Razonador de pistas' },
    description: {
      en: 'Narrows the range with every clue and feedback, and keeps a guess when it is worth more than climbing.',
      es: 'Acota el rango con cada pista y respuesta, y se planta cuando vale más que subir.',
    },
    create: () => new Reasoner(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
