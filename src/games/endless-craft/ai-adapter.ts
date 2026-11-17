/**
 * The AI environment: one session per episode with a budget of 300 combinations. Each action
 * combines two discovered elements not tried together before (`a+b`). Reward: elements discovered.
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
import { combine, combineIds, ELEMENT_IDS, isCraft, newCraft, pairKey, type Craft } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const BUDGET = 300;

const done = (c: Craft) => c.found.length === ELEMENT_IDS.length || c.tried.length >= BUDGET;

export function craftActions(c: Craft): string[] {
  if (done(c)) return [];
  const tried = new Set(c.tried);
  const out: string[] = [];
  for (let i = 0; i < c.found.length; i++)
    for (let j = i; j < c.found.length; j++) {
      const k = pairKey(c.found[i]!, c.found[j]!);
      if (!tried.has(k)) out.push(k);
    }
  return out;
}

function outcome(c: Craft): Outcome | null {
  if (!done(c)) return null;
  return {
    returns: [c.found.length],
    winners: [0],
    draw: false,
    scores: [c.found.length],
    reason: c.found.length === ELEMENT_IDS.length ? 'complete' : 'budget',
  };
}

export const env: GameEnvironment<Craft, string, Craft, Record<string, never>> = {
  id: 'endless-craft',
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
  createInitialState: () => newCraft(),
  reset: () => newCraft(),
  getObservation: (c) => c,
  getLegalActions: craftActions,
  applyAction: (c, a) => {
    if (!craftActions(c).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const [x, y] = a.split('+');
    return combineIds(c, x!, y!);
  },
  getCurrentPlayer: (c) => (done(c) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (c) => outcome(c)?.returns[0] ?? 0,
  serializeState: (c) => JSON.stringify(c),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isCraft(parsed)) throw new Error('Invalid Endless Craft state');
    return parsed;
  },
  cloneState: (c) => structuredClone(c),
  actionToString: (a) => a.replace('+', ' + '),
};

/** Tries pairs with the newest discovery first. */
class Curious implements Agent<Craft, string> {
  readonly id = 'curious';
  readonly label = 'Curious';
  selectAction(_e: GameEnvironment<Craft, string>, c: Craft, _p: number, _ctx: DecisionContext) {
    const legal = craftActions(c);
    for (let i = c.found.length - 1; i >= 0; i--) {
      const id = c.found[i]!;
      const hit = legal.find((k) => k.split('+').includes(id));
      if (hit) return hit;
    }
    return legal[0]!;
  }
}

/** Knows the recipe book: picks a pair that makes something not yet discovered. */
class Oracle implements Agent<Craft, string> {
  readonly id = 'recipe-book';
  readonly label = 'Recipe book';
  selectAction(_e: GameEnvironment<Craft, string>, c: Craft, _p: number, _ctx: DecisionContext) {
    const legal = craftActions(c);
    const found = new Set(c.found);
    const useful = legal.find((k) => {
      const [a, b] = k.split('+');
      const out = combine(a!, b!);
      return out !== null && !found.has(out);
    });
    return useful ?? legal[0]!;
  }
}

export const AGENT_PRESETS: AgentPreset<Craft, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Combines any untried pair.', es: 'Combina cualquier pareja sin probar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'curious',
    kind: 'heuristic',
    label: { en: 'Curious', es: 'Curioso' },
    description: {
      en: 'Tries everything with its newest discovery first.',
      es: 'Lo prueba todo con su último descubrimiento primero.',
    },
    create: () => new Curious(),
  },
  {
    id: 'recipe-book',
    kind: 'heuristic',
    label: { en: 'Recipe book', es: 'Libro de recetas' },
    description: {
      en: 'Cheats: knows every recipe and always makes something new (an upper bound).',
      es: 'Hace trampa: conoce todas las recetas y siempre crea algo nuevo (una cota superior).',
    },
    create: () => new Oracle(),
  },
];

export const bundle: AiBundle<Craft, string> = {
  env: env as unknown as AiBundle<Craft, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
