/**
 * The AI environment: a session of objects (config `{ difficulty, topic, rounds }`, default five
 * Normal objects). An action is a guess expressed as a power of two times the reference size,
 * in quarter steps from 1/32× to 32× (`k` in −20…20 → reference × 2^(k/4)). The observation
 * holds the mystery object's name, family and dimension and the reference — never its size.
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
  current,
  isSession,
  lockIn,
  newEndless,
  next,
  refThing,
  thingAt,
  type Difficulty,
  type Dim,
  type Family,
  type Session,
  type SizeData,
  type Topic,
} from './engine';
import raw from './objects.json';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const DATA = raw as unknown as SizeData;
export const STEPS = Array.from({ length: 41 }, (_, i) => i - 20);

export interface Config {
  difficulty?: Difficulty;
  topic?: Topic;
  rounds?: number;
}

export interface Observation {
  round: number;
  total: number;
  name: string;
  family: Family;
  dim: Dim;
  reference: { name: string; family: Family; metres: number };
}

export function observe(s: Session): Observation {
  const r = current(s);
  const t = thingAt(DATA, r.target);
  const ref = refThing(DATA, r.ref);
  return {
    round: s.count,
    total: s.total,
    name: t.name.en,
    family: t.family,
    dim: t.dim,
    reference: { name: ref.name.en, family: ref.family, metres: ref.metres },
  };
}

export const stepToMetres = (refMetres: number, k: number) => refMetres * Math.pow(2, k / 4);
const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'size-sense',
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
  getLegalActions: (s) => (done(s) ? [] : [...STEPS]),
  applyAction: (s, k) => {
    if (done(s) || !STEPS.includes(k)) throw new IllegalActionError(`Illegal action ${String(k)}`);
    const guess = stepToMetres(refThing(DATA, current(s).ref).metres, k);
    const scored = lockIn(s, DATA, guess);
    return scored.status === 'done' ? scored : next(scored, DATA);
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed, DATA)) throw new Error('Invalid Size Sense session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (k) => `ref×2^(${k}/4)`,
};

/** Median size of each family, leaving one object out (so no object informs its own guess). */
const byFamily = new Map<string, { id: string; m: number }[]>();
for (const [id, family, , m] of DATA.objects) {
  let l = byFamily.get(family);
  if (!l) byFamily.set(family, (l = []));
  l.push({ id, m });
}
for (const l of byFamily.values()) l.sort((a, b) => a.m - b.m);
export function typicalSize(family: Family, excludeName: string): number | null {
  const l = (byFamily.get(family) ?? []).filter((x) => thingName(x.id) !== excludeName);
  if (!l.length) return null;
  return l[Math.floor(l.length / 2)]!.m;
}
const nameById = new Map(DATA.objects.map((o) => [o[0], o[4]]));
const thingName = (id: string) => nameById.get(id);

/** Guesses the median size of the object's family, as the nearest available step. */
class Typical implements Agent<Session, number> {
  readonly id = 'typical';
  readonly label = 'Typical size';
  selectAction(_e: GameEnvironment<Session, number>, s: Session, _p: number, _c: DecisionContext) {
    const o = observe(s);
    const m = typicalSize(o.family, o.name);
    if (m === null) return 0;
    const k = Math.round(4 * Math.log2(m / o.reference.metres));
    return Math.max(-20, Math.min(20, k));
  }
}

class SameAsReference implements Agent<Session, number> {
  readonly id = 'reference';
  readonly label = 'Same as the reference';
  selectAction() {
    return 0;
  }
}

export const AGENT_PRESETS: AgentPreset<Session, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Any size from 1/32 to 32 times the reference.',
      es: 'Cualquier tamaño entre 1/32 y 32 veces la referencia.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'reference',
    kind: 'heuristic',
    label: { en: 'Same as reference', es: 'Igual que la referencia' },
    description: {
      en: 'Leaves the mystery object at the reference size.',
      es: 'Deja el objeto misterioso del tamaño de la referencia.',
    },
    create: () => new SameAsReference(),
  },
  {
    id: 'typical',
    kind: 'heuristic',
    label: { en: 'Typical size', es: 'Tamaño típico' },
    description: {
      en: 'Knows the median size of every kind of object (skyscraper, car, moon…) and guesses it.',
      es: 'Conoce el tamaño mediano de cada tipo de objeto (rascacielos, coche, luna…) y lo usa.',
    },
    create: () => new Typical(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
