import { RandomAgent } from '../../ai/agents/random-agent';
import type { AiBundle } from '../../ai/protocols/bundle';
import { NO_PLAYER, type GameEnvironment, type Outcome } from '../../ai/protocols/types';
import {
  applyClockMove,
  dealClock,
  faceUpCount,
  isValidClockState,
  legalClockMoves,
  type ClockState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function clockOutcome(s: ClockState): Outcome | null {
  if (!s.result) return null;
  const won = s.result === 'won';
  return {
    returns: [won ? 1 : faceUpCount(s) / 52],
    winners: won ? [0] : [],
    draw: false,
    reason: s.result,
  };
}

export const clockEnv: GameEnvironment<ClockState, string> = {
  id: 'clock-solitaire',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (_config, seed) => dealClock(seed >>> 0),
  reset: (seed) => dealClock(seed >>> 0),
  // Face-down cards are hidden: only how many each pile holds.
  getObservation: (s) => ({ ...s, down: s.down.map((p) => p.map(() => -2)) }),
  getLegalActions: (s, player) => (player !== undefined && player !== 0 ? [] : legalClockMoves(s)),
  applyAction: (s, a) => applyClockMove(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : 0),
  isTerminal: (s) => s.result !== null,
  getOutcome: clockOutcome,
  getReward: (s) => clockOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidClockState(parsed)) throw new Error('Invalid clock state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.history.length}|${s.seed}`,
  actionToString: (a) => a,
};

export const AGENT_PRESETS = [
  {
    id: 'random',
    kind: 'random' as const,
    label: { en: 'Dealer', es: 'Crupier' },
    description: {
      en: 'Turns and places every card (Clock has no choices to make).',
      es: 'Gira y coloca cada carta (en el reloj no hay decisiones).',
    },
    create: () => new RandomAgent<ClockState, string>(),
  },
];

export const bundle: AiBundle<ClockState, string> = { env: clockEnv, agents: AGENT_PRESETS };
export default bundle;
