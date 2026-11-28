/**
 * The AI environment: one game per episode, 2–4 seats (config `{ players }`, 2 by default).
 * Actions are fixed integers (see `CODE`). Observations show the board, every player's
 * resources, production and played cards, but only the seat's own hand and offer (other hands as
 * sizes), never the deck order or the generator.
 */
import type { Agent } from '../../ai/agents/types';
import type { AgentPreset, AiBundle } from '../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../ai/protocols/types';
import { RAW_PRESETS } from './ai';
import {
  act,
  currentPlayer,
  isLegal,
  isValidShapers,
  legalActions,
  newShapers,
  type Action,
  type Player,
  type Shapers,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';
import { AWARDS, CARDS, MILESTONES, POS, STD, START_CARDS } from './world';

export interface Config {
  players?: number;
}

const NC = CARDS.length;
const STD_IDS = STD.map((s) => s.id);
export const CODE = {
  pass: 0,
  convertFlora: 1,
  convertHeat: 2,
  corp: 3,
  std: 5,
  claim: 5 + STD.length,
  fund: 5 + STD.length + MILESTONES.length,
  tile: 5 + STD.length + MILESTONES.length + AWARDS.length,
  play: 5 + STD.length + MILESTONES.length + AWARDS.length + POS.length,
  use: 5 + STD.length + MILESTONES.length + AWARDS.length + POS.length + NC,
  sell: 5 + STD.length + MILESTONES.length + AWARDS.length + POS.length + 2 * NC,
  buy: 5 + STD.length + MILESTONES.length + AWARDS.length + POS.length + 3 * NC,
  size:
    5 + STD.length + MILESTONES.length + AWARDS.length + POS.length + 3 * NC + (1 << START_CARDS),
};

export function encode(a: Action): number {
  switch (a.t) {
    case 'pass':
      return CODE.pass;
    case 'convert':
      return a.what === 'flora' ? CODE.convertFlora : CODE.convertHeat;
    case 'corp':
      return CODE.corp + a.i;
    case 'std':
      return CODE.std + STD_IDS.indexOf(a.id);
    case 'claim':
      return CODE.claim + a.m;
    case 'fund':
      return CODE.fund + a.a;
    case 'tile':
      return CODE.tile + a.space;
    case 'play':
      return CODE.play + a.card;
    case 'use':
      return CODE.use + a.card;
    case 'sell':
      return CODE.sell + a.card;
    case 'buy':
      return CODE.buy + a.mask;
  }
}
export function decode(n: number): Action | null {
  if (!Number.isInteger(n) || n < 0 || n >= CODE.size) return null;
  if (n === CODE.pass) return { t: 'pass' };
  if (n === CODE.convertFlora) return { t: 'convert', what: 'flora' };
  if (n === CODE.convertHeat) return { t: 'convert', what: 'heat' };
  if (n < CODE.std) return { t: 'corp', i: n - CODE.corp };
  if (n < CODE.claim) return { t: 'std', id: STD_IDS[n - CODE.std]! };
  if (n < CODE.fund) return { t: 'claim', m: n - CODE.claim };
  if (n < CODE.tile) return { t: 'fund', a: n - CODE.fund };
  if (n < CODE.play) return { t: 'tile', space: n - CODE.tile };
  if (n < CODE.use) return { t: 'play', card: n - CODE.play };
  if (n < CODE.sell) return { t: 'use', card: n - CODE.use };
  if (n < CODE.buy) return { t: 'sell', card: n - CODE.sell };
  return { t: 'buy', mask: n - CODE.buy };
}

type SeenPlayer = Omit<Player, 'hand' | 'offer'> & {
  hand: number[] | null;
  offer: number[] | null;
  handSize: number;
};
export type Observation = Omit<Shapers, 'rng' | 'deck' | 'ps'> & {
  seat: number;
  deckSize: number;
  ps: SeenPlayer[];
};
export function observe(g: Shapers, seat: number): Observation {
  const { rng: _r, deck, ps, ...rest } = g;
  void _r;
  return {
    ...rest,
    seat,
    deckSize: deck.length,
    ps: ps.map((x, q) => ({
      ...x,
      hand: q === seat ? [...x.hand] : null,
      offer: q === seat ? [...x.offer] : null,
      handSize: x.hand.length,
    })),
  };
}

export function outcome(g: Shapers): Outcome | null {
  if (g.phase !== 'over') return null;
  const n = g.winners.length;
  return {
    returns: g.ps.map((_, p) => (g.winners.includes(p) ? 1 / n : 0)),
    winners: n > 1 ? [] : g.winners,
    draw: n > 1,
    scores: (g.scores ?? []).map((s) => s.total),
    reason: 'planet-shaped',
  };
}

export const env: GameEnvironment<Shapers, number, Observation, Config> = {
  id: 'planet-shapers',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    // Draws come from the generator stored in the state.
    stochastic: false,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newShapers([2, 3, 4].includes(c?.players ?? 2) ? (c?.players ?? 2) : 2, seed >>> 0),
  reset: (seed) => newShapers(2, seed >>> 0),
  getObservation: (g, seat) => observe(g, seat),
  getLegalActions: (g) => legalActions(g).map(encode),
  applyAction: (g, n) => {
    const a = decode(n);
    if (!a || !isLegal(g, a)) throw new IllegalActionError(`Illegal action ${String(n)}`);
    return act(g, a);
  },
  getCurrentPlayer: (g) => (g.phase === 'over' ? NO_PLAYER : currentPlayer(g)),
  isTerminal: (g) => g.phase === 'over',
  getOutcome: outcome,
  getReward: (g, seat) => outcome(g)?.returns[seat] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isValidShapers(parsed)) throw new Error('Invalid Planet Shapers state');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (n) => JSON.stringify(decode(n)),
};

function wrap(agent: Agent<Shapers, Action>): Agent<Shapers, number> {
  return {
    id: agent.id,
    label: agent.label,
    selectAction: (e, g, p, ctx) =>
      encode(
        agent.selectAction(e as unknown as GameEnvironment<Shapers, Action>, g, p, ctx) as Action,
      ),
  };
}

export const AGENT_PRESETS: AgentPreset<Shapers, number>[] = RAW_PRESETS.map((a) =>
  a.id === 'random'
    ? (a as unknown as AgentPreset<Shapers, number>)
    : { ...a, create: () => wrap(a.create() as Agent<Shapers, Action>) },
);

export const bundle: AiBundle<Shapers, number> = {
  env: env as unknown as AiBundle<Shapers, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
