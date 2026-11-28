/**
 * The AI environment: a session of places (config `{ difficulty, region, rounds }`, default five
 * Normal places anywhere). Action i names place i of the list. Observations hold the review lines
 * shown so far (both languages), the hints of earlier guesses (distance, compass, closeness) and
 * the places already named — never the answer.
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
  awaiting,
  bearing,
  compassOf,
  current,
  distanceKm,
  guess,
  hintFor,
  isSession,
  linesShown,
  newEndless,
  next,
  placeAt,
  type Difficulty,
  type Hint,
  type PlaceRow,
  type RegionFilter,
  type Session,
} from './engine';
import data from './landmarks.json';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = data as unknown as PlaceRow[];

export interface Config {
  difficulty?: Difficulty;
  region?: RegionFilter;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  lines: { en: string[]; es: string[] };
  hints: Hint[];
  guessed: number[];
}

export function observe(s: Session): Observation {
  const r = current(s);
  const p = placeAt(DATA, r.target);
  const n = linesShown(r.guesses.length);
  return {
    round: s.count,
    total: s.total,
    lines: { en: p.review.en.slice(0, n), es: p.review.es.slice(0, n) },
    hints: r.guesses.filter((g) => g !== r.target).map((g) => hintFor(DATA, g, r.target)),
    guessed: [...r.guesses],
  };
}

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'one-star-landmarks',
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
      c?.region ?? 'all',
      new Set(),
      c?.rounds ?? 5,
    ),
  reset: (seed) => newEndless(DATA, seed >>> 0, 'normal', 'all', new Set(), 5),
  getObservation: (s) => observe(s),
  getLegalActions: (s) => {
    if (done(s)) return [];
    const g = new Set(current(s).guesses);
    return DATA.map((_, i) => i).filter((i) => !g.has(i));
  },
  applyAction: (s, a) => {
    if (done(s) || !awaiting(s)) throw new IllegalActionError('The session is over');
    if (!Number.isInteger(a) || a < 0 || a >= DATA.length || current(s).guesses.includes(a))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const n = guess(s, DATA, a);
    return n.status === 'playing' && current(n).status !== 'playing' ? next(n, DATA) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid One-Star Landmarks session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => DATA[a]?.[1] ?? `place ${a}`,
};

/* ---------- agents ---------- */

/** Places still possible given every hint: same rounded distance (±1 km) and the same compass point. */
export function consistent(o: Observation): number[] {
  const named = new Set(o.guessed);
  return DATA.map((_, i) => i).filter((i) => {
    if (named.has(i)) return false;
    const c = placeAt(DATA, i);
    return o.hints.every((h) => {
      const g = placeAt(DATA, h.guess);
      return (
        Math.abs(Math.round(distanceKm(g, c)) - h.km) <= 1 && compassOf(bearing(g, c)) === h.compass
      );
    });
  });
}
const byFame = (ids: number[]) => [...ids].sort((a, b) => DATA[b]![6] - DATA[a]![6] || a - b);

const STOP = new Set(
  'the a an of and in on at to by for with from it is was were be i my me you your they them this that there not no all one so very just like than then had have has did do what who which when where how its into out up down over about after before been but or as if we our'.split(
    ' ',
  ),
);
export const words = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z]+/)
    .map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w))
    .filter((w) => w.length > 2 && !STOP.has(w));
/** Word → number of places whose description uses it. */
const docFreq = (() => {
  const m = new Map<string, number>();
  for (const r of DATA) for (const w of new Set(words(r[7]))) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
})();
/** How well the review lines match a place's description (idf-weighted shared words). */
export function match(lines: string[], i: number): number {
  const about = new Set(words(DATA[i]![7]));
  let s = 0;
  for (const w of new Set(lines.flatMap(words)))
    if (about.has(w)) s += Math.log(DATA.length / (docFreq.get(w) ?? 1));
  return s;
}

class Triangulator implements Agent<Session, number> {
  readonly id = 'triangulate';
  readonly label = 'Triangulator';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    return byFame(consistent(observe(s)))[0]!;
  }
}

class Reader implements Agent<Session, number> {
  readonly id = 'reader';
  readonly label = 'Review reader';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    const ids = consistent(o);
    // Best description match, fame breaking ties (and choosing when nothing matches).
    return [...ids].sort(
      (a, b) => match(o.lines.en, b) - match(o.lines.en, a) || DATA[b]![6] - DATA[a]![6] || a - b,
    )[0]!;
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Names any place not tried yet.',
      es: 'Nombra cualquier lugar que no haya probado.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'triangulate',
    kind: 'heuristic',
    label: { en: 'Triangulator', es: 'Triangulador' },
    description: {
      en: 'Ignores the review: names the most famous place that fits every distance and direction so far.',
      es: 'Ignora la reseña: nombra el lugar más famoso que encaja con todas las distancias y direcciones.',
    },
    create: () => new Triangulator(),
  },
  {
    id: 'reader',
    kind: 'search',
    label: { en: 'Review reader', es: 'Lector de reseñas' },
    description: {
      en: 'Matches the review’s words against what each place is, among the places the hints still allow.',
      es: 'Compara las palabras de la reseña con lo que es cada lugar, entre los que las pistas aún permiten.',
    },
    create: () => new Reader(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
