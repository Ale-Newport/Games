/**
 * The AI environment: one hour of play per episode, one decision per second. Actions: `click`
 * (ten clicks in that second), `wait`, `buy:<building>`, `up:<upgrade>` and `golden` (when a
 * golden pastry is out). Reward: log10 of the cookies baked, plus one.
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
import {
  BUILDINGS,
  buildingCps,
  buy,
  buyUpgrade,
  click,
  clickGolden,
  cps,
  isBakery,
  newBakery,
  priceOf,
  shop,
  tick,
  type Bakery,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const SECONDS = 3600;
const done = (s: Bakery) => s.t >= SECONDS;

export function bakeryActions(s: Bakery): string[] {
  if (done(s)) return [];
  return [
    'click',
    'wait',
    ...BUILDINGS.filter((b) => s.cookies >= priceOf(s, b.id)).map((b) => `buy:${b.id}`),
    ...shop(s)
      .filter((u) => s.cookies >= u.price)
      .map((u) => `up:${u.id}`),
    ...(s.golden ? ['golden'] : []),
  ];
}

export function applyBakery(s: Bakery, a: string): Bakery {
  if (!bakeryActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
  let next = s;
  if (a === 'click') for (let i = 0; i < 10; i++) next = click(next);
  else if (a.startsWith('buy:')) next = buy(s, a.slice(4));
  else if (a.startsWith('up:')) next = buyUpgrade(s, a.slice(3));
  else if (a === 'golden') next = clickGolden(s);
  return tick(next, 1);
}

const value = (s: Bakery) => 1 + Math.log10(1 + s.baked);

function outcome(s: Bakery): Outcome | null {
  if (!done(s)) return null;
  return {
    returns: [value(s)],
    winners: [0],
    draw: false,
    scores: [Math.floor(s.baked)],
    reason: 'time',
  };
}

export const env: GameEnvironment<Bakery, string, Bakery, Record<string, never>> = {
  id: 'idle-bakery',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'real-time',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: false,
    hiddenInformation: false,
    zeroSum: false,
    tickRate: 1,
  },
  createInitialState: (_c, seed) => newBakery(seed),
  reset: (seed) => newBakery(seed),
  getObservation: (s) => s,
  getLegalActions: bakeryActions,
  applyAction: applyBakery,
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const p: unknown = JSON.parse(data);
    if (!isBakery(p)) throw new Error('Invalid Idle Bakery state');
    return p;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

/**
 * Buys whatever pays for itself fastest (price ÷ extra cookies per second), golden pastries first;
 * otherwise clicks while saving up.
 */
export function paybackAction(s: Bakery): string {
  if (s.golden) return 'golden';
  const base = cps(s) || 0.1;
  let best: { a: string; payback: number; price: number } | null = null;
  for (const b of BUILDINGS) {
    const price = priceOf(s, b.id);
    const gainCps =
      buildingCps({ ...s, owned: { ...s.owned, [b.id]: (s.owned[b.id] ?? 0) + 1 } }, b.id) -
      buildingCps(s, b.id);
    const payback = price / gainCps + Math.max(0, price - s.cookies) / (base + 10);
    if (!best || payback < best.payback) best = { a: `buy:${b.id}`, payback, price };
  }
  for (const u of shop(s)) {
    const after = { ...s, upgrades: [...s.upgrades, u.id] };
    const gainCps = Math.max(
      1e-9,
      cps(after) - cps(s) + (u.kind === 'click' || u.kind === 'clickcps' ? 10 * (1 - 0.5) : 0),
    );
    const payback = u.price / gainCps + Math.max(0, u.price - s.cookies) / (base + 10);
    if (!best || payback < best.payback) best = { a: `up:${u.id}`, payback, price: u.price };
  }
  if (best && s.cookies >= best.price) return best.a;
  return 'click';
}

class Payback implements Agent<Bakery, string> {
  readonly id = 'payback';
  readonly label = 'Payback';
  selectAction(_e: GameEnvironment<Bakery, string>, s: Bakery, _p: number, _c: DecisionContext) {
    return paybackAction(s);
  }
}

export const AGENT_PRESETS: AgentPreset<Bakery, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Clicks, waits or buys anything affordable at random.',
      es: 'Hace clic, espera o compra cualquier cosa asequible al azar.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'payback',
    kind: 'heuristic',
    label: { en: 'Payback', es: 'Amortización' },
    description: {
      en: 'Buys what pays for itself soonest, grabs golden pastries, clicks while saving.',
      es: 'Compra lo que antes se amortiza, atrapa los pasteles dorados y hace clic mientras ahorra.',
    },
    create: () => new Payback(),
  },
];

export const bundle: AiBundle<Bakery, string> = {
  env: env as unknown as AiBundle<Bakery, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
