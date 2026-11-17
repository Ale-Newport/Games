/**
 * The AI environment: one mystery country per episode (config `{ target? }`). Actions `g:<ISO2>`
 * guess a country. Reward: 1 for a solve in one guess down to 1/6 in six; 0 when the six run out.
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
import { COUNTRIES } from '../shared/world/world';
import { triangulatorMove } from './ai';
import {
  MAX_GUESSES,
  TARGETS,
  guess,
  isValidState,
  newGame,
  randomGame,
  type ShapeState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export type ShapeAction = `g:${string}`;

export const shapeActions = (s: ShapeState): ShapeAction[] =>
  s.status !== 'playing'
    ? []
    : COUNTRIES.filter((c) => !s.guesses.includes(c.iso2)).map((c) => `g:${c.iso2}` as ShapeAction);

function outcome(s: ShapeState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? (MAX_GUESSES + 1 - s.guesses.length) / MAX_GUESSES : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [won ? s.guesses.length : 0],
    reason: s.status,
  };
}

export const env: GameEnvironment<ShapeState, ShapeAction, ShapeState, { target?: string }> = {
  id: 'country-shape',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    c?.target && TARGETS.includes(c.target) ? newGame(c.target, null, seed) : randomGame(seed),
  reset: (seed) => randomGame(seed),
  getObservation: (s) => s,
  getLegalActions: shapeActions,
  applyAction: (s, a) => {
    if (!shapeActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
    return guess(s, a.slice(2));
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Country Shape state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a.slice(2),
};

class Triangulator implements Agent<ShapeState, ShapeAction> {
  readonly id = 'triangulator';
  readonly label = 'Triangulator';
  selectAction(
    _e: GameEnvironment<ShapeState, ShapeAction>,
    s: ShapeState,
    _p: number,
    ctx: DecisionContext,
  ): ShapeAction {
    return `g:${triangulatorMove(s, ctx.rng)}`;
  }
}

export const AGENT_PRESETS: AgentPreset<ShapeState, ShapeAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any country.', es: 'Prueba cualquier país.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'triangulator',
    kind: 'heuristic',
    label: { en: 'Triangulator', es: 'Triangulador' },
    description: {
      en: 'Keeps only countries that match every distance and arrow shown.',
      es: 'Se queda solo con los países que encajan con cada distancia y flecha.',
    },
    create: () => new Triangulator(),
  },
];

export const bundle: AiBundle<ShapeState, ShapeAction> = {
  env: env as unknown as AiBundle<ShapeState, ShapeAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
