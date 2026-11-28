/**
 * The AI environment: a session of photos (config `{ difficulty, category, rounds }`, default
 * five Normal photos of any kind). Action i picks option i (0–5) of the current round.
 * Observations hold the kind, the six options (place indices), the options already struck and
 * what the photo shows as colour: the mean RGB of its centre while zoomed in, of all nine cells
 * of a 3 × 3 grid once zoomed out — never the answer.
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
import { greatCircleKm } from '../rough-guess/engine';
import {
  awaiting,
  current,
  isSession,
  newEndless,
  next,
  pick,
  placeAt,
  type Category,
  type CategoryFilter,
  type Difficulty,
  type PlaceRow,
  type Session,
} from './engine';
import data from './places.json';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = data as unknown as PlaceRow[];

export interface Config {
  difficulty?: Difficulty;
  category?: CategoryFilter;
  rounds?: number;
}
export interface Observation {
  round: number;
  total: number;
  category: Category;
  options: number[];
  struck: number[];
  /** Mean RGB per visible cell: 1 cell (the centre) at the first zoom, 9 afterwards. */
  colours: number[];
}

/** The visible part of the photo's colour grid. */
export function visibleColours(colours: number[], wrongPicks: number): number[] {
  return wrongPicks === 0 ? colours.slice(12, 15) : [...colours];
}

export function observe(s: Session): Observation {
  const r = current(s);
  const t = placeAt(DATA, r.target);
  return {
    round: s.count,
    total: s.total,
    category: t.category,
    options: [...r.options],
    struck: r.picks.filter((p) => p !== r.target),
    colours: visibleColours(t.colours, r.picks.length),
  };
}

const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}
const legal = (s: Session) => {
  if (done(s)) return [];
  const r = current(s);
  return r.options.map((_, i) => i).filter((i) => !r.picks.includes(r.options[i]!));
};

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'aerial-eye',
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
      c?.category ?? 'all',
      new Set(),
      c?.rounds ?? 5,
    ),
  reset: (seed) => newEndless(DATA, seed >>> 0, 'normal', 'all', new Set(), 5),
  getObservation: (s) => observe(s),
  getLegalActions: legal,
  applyAction: (s, a) => {
    if (!awaiting(s) || !legal(s).includes(a))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const n = pick(s, current(s).options[a]!);
    return n.status === 'playing' && current(n).status !== 'playing' ? next(n, DATA) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Aerial Eye session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => `option ${a + 1}`,
};

/* ---------- agents ---------- */

const open = (o: Observation) =>
  o.options.map((_, i) => i).filter((i) => !o.struck.includes(o.options[i]!));

class Famous implements Agent<Session, number> {
  readonly id = 'famous';
  readonly label = 'Best known';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    return open(o).sort((a, b) => DATA[o.options[b]!]![8] - DATA[o.options[a]!]![8] || a - b)[0]!;
  }
}

/**
 * Colour reader: predicts what each option should look like from the photos of the three nearest
 * places of the same kind — never using the options' own photos, so the answer's photo is never
 * looked up — and picks the option whose prediction is closest to the colours in view.
 */
export function predictColours(o: Observation, option: number): number[] {
  const p = placeAt(DATA, option);
  const exclude = new Set(o.options);
  const near = DATA.map((_, i) => i)
    .filter((i) => !exclude.has(i) && DATA[i]![1] === p.category)
    .map((i) => [i, greatCircleKm([p.lat, p.lon], [DATA[i]![4], DATA[i]![5]])] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);
  const out = new Array<number>(27).fill(0);
  for (const [i] of near) DATA[i]![10].forEach((c, k) => (out[k]! += c / near.length));
  return out;
}
class ColourReader implements Agent<Session, number> {
  readonly id = 'colours';
  readonly label = 'Colour reader';
  selectAction(_e: GameEnvironment<Session, number>, s: Session) {
    const o = observe(s);
    const dist = (i: number) => {
      const pred = visibleColours(predictColours(o, o.options[i]!), o.colours.length === 3 ? 0 : 1);
      return pred.reduce((acc, c, k) => acc + (c - o.colours[k]!) ** 2, 0);
    };
    return open(o).sort((a, b) => dist(a) - dist(b) || a - b)[0]!;
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Picks any option still open.', es: 'Elige cualquier opción que quede.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'famous',
    kind: 'heuristic',
    label: { en: 'Best known', es: 'El más conocido' },
    description: {
      en: 'Ignores the photo: picks the best-known option still open.',
      es: 'Ignora la foto: elige la opción más conocida que quede.',
    },
    create: () => new Famous(),
  },
  {
    id: 'colours',
    kind: 'search',
    label: { en: 'Colour reader', es: 'Lector de colores' },
    description: {
      en: 'Reads the photo’s colours and compares them with photos of nearby places of the same kind.',
      es: 'Lee los colores de la foto y los compara con fotos de lugares cercanos del mismo tipo.',
    },
    create: () => new ColourReader(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
