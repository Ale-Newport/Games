/** The AI environment: one game per episode, 2–4 seats (config `{ players }`, 2 by default). */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { seatsFor } from '../shared/cross/RaceTable';
import {
  act,
  isValidRace,
  legalActions,
  newRace,
  partnerOf,
  type RaceState,
} from '../shared/cross/race';
import { AGENT_PRESETS } from './ai';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { PACHISI_GAME } from './engine';

export interface PachisiConfig {
  players?: number;
}

export function pachisiOutcome(s: RaceState): Outcome | null {
  if (s.phase !== 'over' || s.winner === null) return null;
  // With four players the partners on opposite arms win together.
  const partner = partnerOf(PACHISI_GAME, s, s.winner);
  const winners = partner === null ? [s.winner] : [s.winner, partner].sort((a, b) => a - b);
  return {
    returns: s.seats.map((_, seat) => (winners.includes(seat) ? 1 : 0)),
    winners,
    draw: false,
    scores: s.tokens.map((row) => row.filter((x) => x === PACHISI_GAME.last).length),
    reason: 'all-home',
  };
}

const countOf = (config?: PachisiConfig) =>
  [2, 3, 4].includes(config?.players ?? 2) ? (config?.players ?? 2) : 2;
const seatsOk = (seats: number[]) =>
  [2, 3, 4].some((n) => JSON.stringify(seatsFor(n)) === JSON.stringify(seats));

export const pachisiEnv: GameEnvironment<RaceState, string, RaceState, PachisiConfig> = {
  id: 'pachisi',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    // Throws come from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
  },
  createInitialState: (config, seed) =>
    newRace(PACHISI_GAME, seatsFor(countOf(config)), seed >>> 0),
  reset: (seed) => newRace(PACHISI_GAME, seatsFor(2), seed >>> 0),
  getObservation: (s) => s,
  getLegalActions: (s) => legalActions(PACHISI_GAME, s),
  applyAction: (s, a) => {
    if (!legalActions(PACHISI_GAME, s).includes(a))
      throw new IllegalActionError(`Illegal action ${a}`);
    return act(PACHISI_GAME, s, a);
  },
  getCurrentPlayer: (s) => (s.phase === 'over' ? NO_PLAYER : s.turn),
  isTerminal: (s) => s.phase === 'over',
  getOutcome: pachisiOutcome,
  getReward: (s, seat) => pachisiOutcome(s)?.returns[seat] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidRace(PACHISI_GAME, parsed, seatsOk)) throw new Error('Invalid Pachisi state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

export const bundle: AiBundle<RaceState, string> = {
  env: pachisiEnv as unknown as AiBundle<RaceState, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
