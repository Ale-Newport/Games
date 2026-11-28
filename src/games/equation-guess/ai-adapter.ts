/**
 * The AI environment: a session of puzzles (config `{ size, puzzles }`, default three Classic
 * puzzles). Action i guesses equation i of the size's answer pool (every pool entry is a true
 * equation). Observations hold the size, the tries left and every guess with its marks — never
 * the answer.
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
import type { Rng } from '../../core/game-engine/random';
import data from './equations.json';
import {
  answersFor,
  awaiting,
  current,
  isSession,
  mark,
  newEndless,
  next,
  pattern,
  submit,
  TRIES,
  type EquationData,
  type Mark,
  type Session,
  type Size,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DATA = data as unknown as EquationData;

export interface Config {
  size?: Size;
  puzzles?: number;
}
export interface Observation {
  puzzle: number;
  total: number;
  size: Size;
  triesLeft: number;
  history: { guess: string; marks: Mark[] }[];
}

export function observe(s: Session): Observation {
  const p = current(s);
  return {
    puzzle: s.count,
    total: s.total,
    size: p.size,
    triesLeft: TRIES[p.size] - p.guesses.length,
    history: p.guesses.map((g) => ({ guess: g, marks: mark(g, p.answer) })),
  };
}

const mix = (seed: number) => (Math.imul(seed >>> 0, 2654435761) ^ 0x9e37_79b9) >>> 0;
const done = (s: Session) => s.status === 'done';
function outcome(s: Session): Outcome | null {
  if (!done(s)) return null;
  return { returns: [s.total], winners: [0], draw: false, scores: [s.total], reason: 'complete' };
}
const legal = (s: Session) => {
  if (done(s)) return [];
  const p = current(s);
  const pool = answersFor(DATA, p.size);
  const tried = new Set(p.guesses);
  return pool.map((_, i) => i).filter((i) => !tried.has(pool[i]!));
};

export const env: GameEnvironment<Session, number, Observation, Config> = {
  id: 'equation-guess',
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
  // The puzzle seed is mixed so it never mirrors an agent's own random stream started from the same
  // number (an agent picking pool index k would otherwise hit the answer drawn as index k).
  createInitialState: (c, seed) =>
    newEndless(DATA, mix(seed), c?.size ?? 'classic', new Set(), c?.puzzles ?? 3),
  reset: (seed) => newEndless(DATA, mix(seed), 'classic', new Set(), 3),
  getObservation: (s) => observe(s),
  getLegalActions: legal,
  applyAction: (s, a) => {
    if (!awaiting(s)) throw new IllegalActionError('No puzzle is waiting');
    const pool = answersFor(DATA, current(s).size);
    const g = pool[a];
    if (g === undefined || current(s).guesses.includes(g))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    const n = submit(s, g);
    return n.status === 'playing' && current(n).status !== 'playing' ? next(n, DATA) : n;
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isSession(parsed)) throw new Error('Invalid Equation Guess session');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => `guess #${a}`,
};

/* ---------- agents ---------- */

/** Pool indices still possible: every earlier guess would have given exactly the marks seen. */
export function consistent(o: Observation): number[] {
  const pool = answersFor(DATA, o.size);
  const seen = o.history.map((h) => [h.guess, pattern(h.marks)] as const);
  const tried = new Set(o.history.map((h) => h.guess));
  return pool
    .map((_, i) => i)
    .filter(
      (i) => !tried.has(pool[i]!) && seen.every(([g, p]) => pattern(mark(g, pool[i]!)) === p),
    );
}

class Consistent implements Agent<Session, number> {
  readonly id = 'consistent';
  readonly label = 'Consistent guesser';
  selectAction(_e: GameEnvironment<Session, number>, s: Session, _p: number, ctx: { rng: Rng }) {
    return ctx.rng.pick(consistent(observe(s)));
  }
}

/**
 * The solver: among the still-possible equations (a sample of at most 150), the guess that splits a
 * sample of at most 300 candidates into the most different mark patterns — the guess that tells
 * the most, while still possibly being right.
 */
class Solver implements Agent<Session, number> {
  readonly id = 'solver';
  readonly label = 'Solver';
  selectAction(_e: GameEnvironment<Session, number>, s: Session, _p: number, ctx: { rng: Rng }) {
    const o = observe(s);
    const pool = answersFor(DATA, o.size);
    const cand = consistent(o);
    if (cand.length <= 2) return cand[0]!;
    const sample = (xs: number[], n: number) =>
      xs.length <= n ? xs : ctx.rng.shuffle(xs).slice(0, n);
    const targets = sample(cand, 300);
    let best = cand[0]!;
    let bestN = -1;
    for (const g of sample(cand, 150)) {
      const groups = new Set(targets.map((t) => pattern(mark(pool[g]!, pool[t]!))));
      if (groups.size > bestN) {
        bestN = groups.size;
        best = g;
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
    description: {
      en: 'Any true equation not tried yet.',
      es: 'Cualquier ecuación verdadera que no haya probado.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'consistent',
    kind: 'heuristic',
    label: { en: 'Consistent guesser', es: 'Coherente' },
    description: {
      en: 'Guesses a random equation that fits every mark so far.',
      es: 'Prueba una ecuación al azar que encaje con todas las marcas.',
    },
    create: () => new Consistent(),
  },
  {
    id: 'solver',
    kind: 'search',
    label: { en: 'Solver', es: 'Resolutor' },
    description: {
      en: 'Picks the possible equation whose marks would split the remaining candidates the most.',
      es: 'Elige la ecuación posible cuyas marcas repartirían más a los candidatos que quedan.',
    },
    create: () => new Solver(),
  },
];

export const bundle: AiBundle<Session, number> = {
  env: env as unknown as AiBundle<Session, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
