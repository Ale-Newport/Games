import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  POINTS,
  applyPaperSoccerAction,
  createPaperSoccerState,
  isValidPaperSoccerState,
  legalPaperSoccerActions,
  type PaperSoccerState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function paperSoccerOutcome(s: PaperSoccerState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: s.result.reason,
  };
}

export const paperSoccerEnv: GameEnvironment<PaperSoccerState, string> = {
  id: 'paper-soccer',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    actionSpaceSize: 8,
    observationShape: [9, POINTS],
  },
  createInitialState: () => createPaperSoccerState(),
  reset: () => createPaperSoccerState(),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : legalPaperSoccerActions(s),
  applyAction: (s, a) => applyPaperSoccerAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: paperSoccerOutcome,
  getReward: (s, p) => paperSoccerOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidPaperSoccerState(parsed)) throw new Error('Invalid paper-soccer state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.ball}|${s.toMove}|${s.edges.join('')}`,
  encodeAction: (a) => Number(a),
  decodeAction: (i) => String(i),
  actionToString: (a) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Number(a)] ?? a,
  getObservationTensor: (s, player) => {
    // Planes: the drawn lines in each of the eight directions, then the ball. The field is turned
    // for Teal so the observer always attacks "up".
    const data = new Array<number>(9 * POINTS).fill(0);
    const turn = (p: number) => (player === 1 ? POINTS - 1 - p : p);
    for (let p = 0; p < POINTS; p++)
      for (let d = 0; d < 8; d++)
        if (s.edges[p * 8 + d]) data[(player === 1 ? (d + 4) % 8 : d) * POINTS + turn(p)] = 1;
    data[8 * POINTS + turn(s.ball)] = 1;
    return { shape: [9, POINTS], data };
  },
};

export const bundle: AiBundle<PaperSoccerState, string> = {
  env: paperSoccerEnv,
  agents: AGENT_PRESETS,
};
export default bundle;
