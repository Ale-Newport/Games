/**
 * The AI environment: one deal per episode (config `{ layout }`, Crossroads by default). The return
 * is the share of tiles removed (1 when the layout is cleared). Covered faces are hidden from the
 * observation.
 */
import type { AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS, visibleFaces } from './ai';
import {
  act,
  isValidMahjong,
  LAYOUTS,
  legalActions,
  newMahjong,
  tilesLeft,
  type MahjongGame,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface MahjongConfig {
  layout?: string;
}

export function mahjongOutcome(g: MahjongGame): Outcome | null {
  if (g.phase === 'play') return null;
  const removed = 1 - tilesLeft(g) / g.faces.length;
  return {
    returns: [removed],
    winners: g.phase === 'won' ? [0] : [],
    draw: false,
    scores: [g.faces.length - tilesLeft(g)],
    reason: g.phase === 'won' ? 'cleared' : 'stuck',
  };
}

export const mahjongEnv: GameEnvironment<MahjongGame, string, MahjongGame, MahjongConfig> = {
  id: 'mahjong-solitaire',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 1,
    maxPlayers: 1,
    // Shuffles draw from the generator stored in the state: transitions are deterministic.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (config, seed) =>
    newMahjong(
      LAYOUTS.some((l) => l.id === config?.layout) ? config!.layout! : 'crossroads',
      seed >>> 0,
    ),
  reset: (seed) => newMahjong('crossroads', seed >>> 0),
  getObservation: (g) => ({ ...g, faces: visibleFaces(g) }),
  getLegalActions: (g) => legalActions(g),
  applyAction: (g, a) => {
    if (!legalActions(g).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'play' ? 0 : NO_PLAYER),
  isTerminal: (g) => g.phase !== 'play',
  getOutcome: mahjongOutcome,
  getReward: (g) => mahjongOutcome(g)?.returns[0] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidMahjong(parsed)) throw new Error('Invalid Mahjong solitaire state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => a,
};

export const bundle: AiBundle<MahjongGame, string> = {
  env: mahjongEnv as unknown as AiBundle<MahjongGame, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
