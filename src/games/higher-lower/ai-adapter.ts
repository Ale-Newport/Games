/**
 * The AI environment: one run per episode (config `{ mode }`). Actions: `higher` or `lower` for
 * the hidden card. Reward: the score; episodes stop at 100 points.
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
import { ITEMS } from './data';
import { guess, isRun, itemA, newRun, type Guess, type Mode, type Run } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

const CAP = 100;
const done = (r: Run) => r.over || r.score >= CAP;

function outcome(r: Run): Outcome | null {
  if (!done(r)) return null;
  return {
    returns: [r.score],
    winners: [0],
    draw: false,
    scores: [r.score],
    reason: r.over ? 'wrong' : 'cap',
  };
}

export const env: GameEnvironment<Run, Guess, Run, { mode?: Mode }> = {
  id: 'higher-lower',
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
  createInitialState: (c, seed) => newRun(seed >>> 0, c?.mode ?? 'population'),
  reset: (seed) => newRun(seed >>> 0, 'population'),
  getObservation: (r) => r,
  getLegalActions: (r) => (done(r) ? [] : ['higher', 'lower']),
  applyAction: (r, a) => {
    if (done(r) || (a !== 'higher' && a !== 'lower'))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    return guess(r, a);
  },
  getCurrentPlayer: (r) => (done(r) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (r) => outcome(r)?.returns[0] ?? 0,
  serializeState: (r) => JSON.stringify(r),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isRun(parsed)) throw new Error('Invalid Higher or Lower run');
    return parsed;
  },
  cloneState: (r) => structuredClone(r),
  actionToString: (a) => a,
};

/** Guesses from where the shown number sits in its category: above the median → lower. */
export function medianGuess(r: Run): Guess {
  const a = itemA(r);
  const values = ITEMS[a.cat].map((i) => i.value).sort((x, y) => x - y);
  const below = values.filter((v) => v < a.value).length;
  return below >= values.length / 2 ? 'lower' : 'higher';
}

class Median implements Agent<Run, Guess> {
  readonly id = 'median';
  readonly label = 'Median';
  selectAction(_e: GameEnvironment<Run, Guess>, r: Run, _p: number, _ctx: DecisionContext) {
    return medianGuess(r);
  }
}

export const AGENT_PRESETS: AgentPreset<Run, Guess>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Flips a coin.', es: 'Lanza una moneda.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'median',
    kind: 'heuristic',
    label: { en: 'Median', es: 'Mediana' },
    description: {
      en: 'Knows only how the shown number ranks in its category: high numbers → lower, low → higher.',
      es: 'Solo sabe dónde queda el número visible en su categoría: si es alto, «menos»; si es bajo, «más».',
    },
    create: () => new Median(),
  },
];

export const bundle: AiBundle<Run, Guess> = {
  env: env as unknown as AiBundle<Run, Guess>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
