/**
 * The AI environment: one mystery country per episode (config `{ target? }`); actions `g:<ISO2>`
 * guess a country, `give-up` ends. Reward 1 / (1 + log2(guesses)) on a find.
 * The border tracker keeps only countries matching every border distance seen.
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
import { COUNTRIES, borderKm } from '../shared/world/world';
import {
  TARGETS,
  distanceOf,
  giveUp,
  guess,
  isValidState,
  newGame,
  randomGame,
  type GlobeState,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export type GlobeAction = `g:${string}` | 'give-up';

export const globeActions = (s: GlobeState): GlobeAction[] =>
  s.status !== 'playing'
    ? []
    : [
        ...COUNTRIES.filter((c) => !s.guesses.includes(c.iso2)).map(
          (c) => `g:${c.iso2}` as GlobeAction,
        ),
        'give-up',
      ];

export function trackerMove(s: GlobeState, rng: Rng): string {
  if (s.guesses.length === 0) return rng.pick(['DE', 'EG', 'KZ', 'BR', 'US', 'IN', 'AU', 'CN']);
  const seen = s.guesses.map((g) => [g, distanceOf(s, g)] as const);
  const cands = TARGETS.filter(
    (c) => !s.guesses.includes(c) && seen.every(([g, km]) => borderKm(g, c) === km),
  );
  if (cands.length === 0) return rng.pick(TARGETS.filter((c) => !s.guesses.includes(c)));
  // Prefer the candidate that best separates the others by border distance.
  let best = cands[0]!;
  let spread = -1;
  for (const c of cands.slice(0, 30)) {
    const ds = new Set(cands.map((o) => Math.round(borderKm(c, o) / 50)));
    if (ds.size > spread) {
      spread = ds.size;
      best = c;
    }
  }
  return best;
}

function outcome(s: GlobeState): Outcome | null {
  if (s.status === 'playing') return null;
  const won = s.status === 'won';
  return {
    returns: [won ? 1 / (1 + Math.log2(s.guesses.length)) : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [s.guesses.length],
    reason: s.status,
  };
}

export const env: GameEnvironment<GlobeState, GlobeAction, GlobeState, { target?: string }> = {
  id: 'globe-hot-cold',
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
    c?.target && TARGETS.includes(c.target) ? newGame(c.target) : randomGame(seed),
  reset: (seed) => randomGame(seed),
  getObservation: (s) => s,
  getLegalActions: globeActions,
  applyAction: (s, a) => {
    if (!globeActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
    return a === 'give-up' ? giveUp(s) : guess(s, a.slice(2));
  },
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid globe state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => (a === 'give-up' ? a : a.slice(2)),
};

class Tracker implements Agent<GlobeState, GlobeAction> {
  readonly id = 'tracker';
  readonly label = 'Border tracker';
  selectAction(
    _e: GameEnvironment<GlobeState, GlobeAction>,
    s: GlobeState,
    _p: number,
    ctx: DecisionContext,
  ): GlobeAction {
    return `g:${trackerMove(s, ctx.rng)}`;
  }
}

export const AGENT_PRESETS: AgentPreset<GlobeState, GlobeAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any country.', es: 'Prueba cualquier país.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'tracker',
    kind: 'heuristic',
    label: { en: 'Border tracker', es: 'Rastreador de fronteras' },
    description: {
      en: 'Keeps only countries matching every border distance seen.',
      es: 'Se queda con los países que encajan con cada distancia vista.',
    },
    create: () => new Tracker(),
  },
];

export const bundle: AiBundle<GlobeState, GlobeAction> = {
  env: env as unknown as AiBundle<GlobeState, GlobeAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
