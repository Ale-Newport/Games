/**
 * The AI environment: a session of events (config `{ difficulty, era, topic, rounds }`, default
 * five Normal events of any era and topic). Action k (0–1000) guesses the year at timeline
 * position k / 1000. Observations hold the event's kind, English name and description — never its
 * year or Wikidata id.
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
import data from './events.json';
import {
  awaiting,
  current,
  eventAt,
  guess,
  isSession,
  newEndless,
  next,
  positionOf,
  yearAt,
  type Difficulty,
  type EraFilter,
  type EventData,
  type Kind,
  type Session,
  type Topic,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = data as unknown as EventData;
export const STEPS = 1000;

export interface Config {
  difficulty?: Difficulty;
  era?: EraFilter;
  topic?: Topic;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  kind: Kind;
  name: string;
  description: string;
  /** The Spanish name and description (many events only have a Spanish description). */
  nameEs: string;
  descriptionEs: string;
}

export function observe(s: Session): Observation {
  const e = eventAt(DATA, current(s).event);
  return {
    round: s.count,
    total: s.total,
    kind: e.kind,
    name: e.name.en,
    description: e.description.en,
    nameEs: e.name.es,
    descriptionEs: e.description.es,
  };
}

export const actionYear = (a: number) => yearAt(a / STEPS);
export const nearestAction = (year: number) => Math.round(positionOf(year) * STEPS);

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}
const ACTIONS = Array.from({ length: STEPS + 1 }, (_, i) => i);

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'year-guess',
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
      c?.era ?? 'all',
      c?.topic ?? 'all',
      new Set(),
      c?.rounds ?? 5,
    ),
  reset: (seed) => newEndless(DATA, seed >>> 0, 'normal', 'all', 'all', new Set(), 5),
  getObservation: (s) => observe(s),
  getLegalActions: (s) => (done(s) ? [] : ACTIONS),
  applyAction: (s, a) => {
    if (done(s) || !awaiting(s)) throw new IllegalActionError('The session is over');
    if (!Number.isInteger(a) || a < 0 || a > STEPS)
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const n = guess(s, DATA, actionYear(a));
    return n.status === 'playing' ? next(n, DATA) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Year Guess session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => `year ${actionYear(a)}`,
};

/* ---------- agents ---------- */

/** Median timeline position of each kind's events. */
const kindMedian = (() => {
  const by = new Map<Kind, number[]>();
  for (const e of DATA.events) {
    const k = DATA.kinds[e[0]]!;
    by.set(k, [...(by.get(k) ?? []), positionOf(e[1])]);
  }
  const out = new Map<Kind, number>();
  for (const [k, ps] of by) out.set(k, ps.sort((a, b) => a - b)[ps.length >> 1]!);
  return out;
})();

const STOP = new Set(
  'the of and in a an on to by for at from with de la el los las del en y por con un una al que se'.split(
    ' ',
  ),
);
/** Lower-case words without accents or stop words. */
export const tokens = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
/** Words and adjacent word pairs (“second world”, “world war”) of every text, once each. */
const features = (texts: string[]) => {
  const out = new Set<string>();
  for (const t of texts) {
    const w = tokens(t);
    w.forEach((x, i) => {
      out.add(x);
      if (i + 1 < w.length) out.add(`${x} ${w[i + 1]}`);
    });
  }
  return out;
};

/** Feature → [event indices] over both languages' names and descriptions. */
const index = (() => {
  const m = new Map<string, number[]>();
  DATA.events.forEach((e, i) => {
    for (const f of features([e[2], e[3], e[4], e[5]])) m.set(f, [...(m.get(f) ?? []), i]);
  });
  return m;
})();

/**
 * Clue words: every word or word pair of the names and descriptions that other events share
 * votes for their timeline positions, weighted by how rare it is (idf²) and split evenly among the
 * events sharing it; the answer is the weighted median, with the kind's median as a prior vote.
 * The event itself (same English name and kind) is left out.
 */
export function clueEstimate(o: Observation): number {
  const n = DATA.events.length;
  const votes: [number, number][] = [[kindMedian.get(o.kind) ?? 0.8, 2]];
  for (const f of features([o.name, o.nameEs, o.description, o.descriptionEs])) {
    const ids = (index.get(f) ?? []).filter(
      (i) => !(DATA.events[i]![2] === o.name && DATA.kinds[DATA.events[i]![0]] === o.kind),
    );
    if (!ids.length || ids.length > n / 25) continue;
    const idf = Math.log(n / ids.length);
    const w = (idf * idf) / ids.length;
    for (const i of ids) votes.push([positionOf(DATA.events[i]![1]), w]);
  }
  votes.sort((a, b) => a[0] - b[0]);
  const half = votes.reduce((a, v) => a + v[1], 0) / 2;
  let acc = 0;
  for (const [p, w] of votes) {
    acc += w;
    if (acc >= half) return p;
  }
  return votes[votes.length - 1]![0];
}

class KindAgent implements Agent<Session, number> {
  readonly id = 'kind';
  readonly label = 'Typical year';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    return Math.round((kindMedian.get(observe(s).kind) ?? 0.8) * STEPS);
  }
}

class ClueAgent implements Agent<Session, number> {
  readonly id = 'clues';
  readonly label = 'Clue words';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    return Math.round(clueEstimate(observe(s)) * STEPS);
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'A random point of the timeline.',
      es: 'Un punto cualquiera de la línea del tiempo.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'kind',
    kind: 'heuristic',
    label: { en: 'Typical year', es: 'Año típico' },
    description: {
      en: 'The median year of events of the same kind (films, battles, treaties…).',
      es: 'El año mediano de los sucesos del mismo tipo (películas, batallas, tratados…).',
    },
    create: () => new KindAgent(),
  },
  {
    id: 'clues',
    kind: 'search',
    label: { en: 'Clue words', es: 'Palabras clave' },
    description: {
      en: 'Reads the name and description: rare words shared with other events pull the guess towards their years.',
      es: 'Lee el nombre y la descripción: las palabras poco comunes que comparte con otros sucesos acercan la estimación a sus años.',
    },
    create: () => new ClueAgent(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
