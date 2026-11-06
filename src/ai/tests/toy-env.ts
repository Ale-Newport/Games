import {
  IllegalActionError,
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
} from '../protocols/types';

/** Test fixture: single-pile Nim, take 1–3, whoever takes the last object wins. */
export interface PileState {
  pile: number;
  player: number;
  lastMover: number | null;
}

export const pileEnv: GameEnvironment<PileState, number, PileState, { pile: number }> = {
  id: 'toy-pile',
  version: '1.0.0',
  rulesetId: 'take-1-3-normal',
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: 3,
  },
  createInitialState: (config) => ({ pile: config?.pile ?? 10, player: 0, lastMover: null }),
  reset(seed) {
    return this.createInitialState(undefined, seed);
  },
  getObservation: (s) => ({ ...s }),
  getLegalActions: (s) => (s.pile === 0 ? [] : [1, 2, 3].filter((n) => n <= s.pile)),
  applyAction(s, n) {
    if (!this.getLegalActions(s).includes(n)) throw new IllegalActionError(`take ${n}`);
    return { pile: s.pile - n, player: 1 - s.player, lastMover: s.player };
  },
  getCurrentPlayer: (s) => (s.pile === 0 ? NO_PLAYER : s.player),
  isTerminal: (s) => s.pile === 0,
  getOutcome: (s) =>
    s.pile === 0 && s.lastMover !== null
      ? {
          returns: standardReturns(2, [s.lastMover]),
          winners: [s.lastMover],
          draw: false,
          reason: 'last-take',
        }
      : null,
  getReward(s, p) {
    return this.getOutcome(s)?.returns[p] ?? 0;
  },
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (d) => JSON.parse(d) as PileState,
  cloneState: (s) => ({ ...s }),
  stateKey: (s) => `${s.pile}:${s.player}`,
  encodeAction: (n) => n - 1,
  decodeAction: (i) => i + 1,
};
