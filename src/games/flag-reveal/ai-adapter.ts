/**
 * The AI environment: one hidden flag per episode (config `{ target? }`); actions `g:<ISO2>`.
 * Reward (7 − guesses) / 6 for a solve. The triangulator reads only the distance clues.
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
import type { Rng } from '../../core/game-engine/random';
import { bestSplit, consistentTargets } from '../shared/world/clues';
import { COUNTRIES } from '../shared/world/world';
import {
  MAX_GUESSES,
  TARGETS,
  guess,
  isValidState,
  newGame,
  randomGame,
  type FlagState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export type FlagAction = `g:${string}`;

export const flagActions = (s: FlagState): FlagAction[] =>
  s.status !== 'playing'
    ? []
    : COUNTRIES.filter((c) => !s.guesses.includes(c.iso2)).map((c) => `g:${c.iso2}` as FlagAction);

export function triangulatorMove(s: FlagState, rng: Rng): string {
  if (s.guesses.length === 0) return rng.pick(['DE', 'EG', 'KZ', 'BR', 'US', 'IN', 'AU', 'TR']);
  const cands = consistentTargets(s.guesses, s.target, TARGETS);
  return (
    (cands.length <= 2 ? cands[0] : bestSplit(cands)) ??
    rng.pick(TARGETS.filter((c) => !s.guesses.includes(c)))
  );
}

function outcome(s: FlagState): Outcome | null {
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

export const env: GameEnvironment<FlagState, FlagAction, FlagState, { target?: string }> = {
  id: 'flag-reveal',
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
  getLegalActions: flagActions,
  applyAction: (s, a) => {
    if (!flagActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
    return guess(s, a.slice(2));
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Flag Reveal state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a.slice(2),
};

class Triangulator implements Agent<FlagState, FlagAction> {
  readonly id = 'triangulator';
  readonly label = 'Triangulator';
  selectAction(
    _e: GameEnvironment<FlagState, FlagAction>,
    s: FlagState,
    _p: number,
    ctx: DecisionContext,
  ): FlagAction {
    return `g:${triangulatorMove(s, ctx.rng)}`;
  }
}

export const AGENT_PRESETS: AgentPreset<FlagState, FlagAction>[] = [
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
      en: 'Keeps only countries that match every distance and arrow (ignores the flag).',
      es: 'Se queda con los países que encajan con cada distancia y flecha (no mira la bandera).',
    },
    create: () => new Triangulator(),
  },
];

export const bundle: AiBundle<FlagState, FlagAction> = {
  env: env as unknown as AiBundle<FlagState, FlagAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
