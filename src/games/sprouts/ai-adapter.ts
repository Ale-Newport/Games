import type { AiBundle } from '../../ai/protocols/bundle';
import {
  NO_PLAYER,
  standardReturns,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { AGENT_PRESETS } from './ai';
import {
  H,
  W,
  applySproutsAction,
  buildGrid,
  createSproutsState,
  isValidSproutsState,
  joinable,
  regions,
  spotCountFor,
  type SproutsState,
} from './engine';
import { route } from './route';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export function sproutsOutcome(s: SproutsState): Outcome | null {
  if (!s.result) return null;
  return {
    returns: standardReturns(2, [s.result.winner]),
    winners: [s.result.winner],
    draw: false,
    reason: 'no-curve',
  };
}

/**
 * Every curve is a legal action, so the list of legal actions is a representative set: the
 * shortest curve for each pair of spots (and loop) that can be joined. `applyAction` accepts any
 * legal curve. Curves have no fixed index, so there is no action codec.
 */
function representativeCurves(s: SproutsState): string[] {
  if (s.result) return [];
  const g = buildGrid(s);
  const ids = regions(g);
  const out: string[] = [];
  for (const [a, b, region] of joinable(s, g)) {
    const path = route(s, a, b, region, undefined, g, ids);
    if (path) out.push(path.join('.'));
  }
  return out;
}

export const sproutsEnv: GameEnvironment<SproutsState, string> = {
  id: 'sprouts',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 2,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: true,
    observationShape: [3, H, W],
  },
  // The seed picks the number of starting spots (3–5).
  createInitialState: (_c, seed) => createSproutsState(spotCountFor(seed)),
  reset: (seed) => createSproutsState(spotCountFor(seed)),
  getObservation: (s) => structuredClone(s),
  getLegalActions: (s, player) =>
    player !== undefined && player !== s.toMove ? [] : representativeCurves(s),
  applyAction: (s, a) => applySproutsAction(s, a),
  getCurrentPlayer: (s) => (s.result ? NO_PLAYER : s.toMove),
  isTerminal: (s) => s.result !== null,
  getOutcome: sproutsOutcome,
  getReward: (s, p) => sproutsOutcome(s)?.returns[p] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidSproutsState(parsed)) throw new Error('Invalid sprouts state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  stateKey: (s) => `${s.spotCount}|${s.history.join('|')}`,
  actionToString: (a) => a,
  getObservationTensor: (s) => {
    // Planes: curve cells, spots, remaining lives per spot cell (scaled to [0, 1]).
    const data = new Array<number>(3 * W * H).fill(0);
    for (const curve of s.curves) for (const p of curve) data[p] = 1;
    for (const spot of s.spots) {
      data[W * H + spot.cell] = 1;
      data[2 * W * H + spot.cell] = spot.lives / 3;
    }
    return { shape: [3, H, W], data };
  },
};

export const bundle: AiBundle<SproutsState, string> = { env: sproutsEnv, agents: AGENT_PRESETS };
export default bundle;
