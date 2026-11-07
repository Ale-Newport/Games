/**
 * GameEnvironment for the community-card poker games. An episode is a single hand (by default
 * heads-up, 2–6 seats via the config) from equal stacks of 1500 at the first blind level; the
 * returns are each seat's net result in big blinds. Observations hide the deck and the other
 * seats' hole cards unless they were shown at showdown.
 */
import {
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
  type PlayerId,
} from '../../../ai/protocols/types';
import {
  BLIND_LEVELS,
  applyPokerAction,
  createPoker,
  isUpCard,
  isValidPokerState,
  legalPokerActions,
  type PokerState,
  type PokerVariant,
} from './engine';

export const START_STACK = 1500;
export const UNKNOWN = -1;

export interface PokerConfig {
  players?: number;
}

const BIG_BLIND = BLIND_LEVELS[0]![1];

export function pokerOutcome(s: PokerState): Outcome | null {
  if (s.street !== 'done' || !s.result) return null;
  const returns = s.seats.map((x) => (x.stack - START_STACK) / BIG_BLIND);
  const winners = returns.flatMap((r, i) => (r > 0 ? [i] : []));
  return {
    returns,
    winners,
    draw: winners.length === 0,
    scores: s.seats.map((x) => x.stack),
    reason: s.result.shown.length ? 'showdown' : 'fold',
  };
}

/**
 * What `player` may see: their own cards, the board, the other seats' face-up stud cards and any
 * cards shown at showdown.
 */
export function maskPoker(s: PokerState, player: PlayerId): PokerState {
  const shown = s.result?.shown ?? [];
  const stud = s.variant === 'stud';
  return {
    ...s,
    deck: [],
    seats: s.seats.map((x, i) =>
      i === player || shown.includes(i)
        ? x
        : { ...x, hole: x.hole.map((c, k) => (stud && isUpCard(k) ? c : UNKNOWN)) },
    ),
  };
}

export function createPokerEnv(
  v: PokerVariant,
  info: { id: string; version: string; rulesetId: string },
): GameEnvironment<PokerState, string, PokerState, PokerConfig> {
  const create = (config: PokerConfig | undefined, seed: number) =>
    createPoker(v, seed >>> 0, Math.min(6, Math.max(2, config?.players ?? 2)), START_STACK);
  return {
    ...info,
    info: {
      kind: 'turn-based',
      minPlayers: 2,
      maxPlayers: 6,
      stochastic: false,
      hiddenInformation: true,
      zeroSum: true,
    },
    createInitialState: create,
    reset: (seed) => create(undefined, seed),
    getObservation: maskPoker,
    getLegalActions: (s, player) =>
      s.street === 'done' || (player !== undefined && player !== s.toAct)
        ? []
        : legalPokerActions(s),
    applyAction: applyPokerAction,
    getCurrentPlayer: (s) => (s.street === 'done' ? NO_PLAYER : s.toAct),
    isTerminal: (s) => s.street === 'done',
    getOutcome: pokerOutcome,
    getReward: (s, p) => pokerOutcome(s)?.returns[p] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidPokerState(v, parsed, START_STACK)) throw new Error('Invalid poker state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}
