/**
 * Tube-sorting agents and the environment factory: a random move, a greedy sorter (moves onto a
 * tube already holding only that color first, never straight back), and the solver (depth-first search with dead-position
 * memory, replanned from wherever the game stands).
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { Rng } from '../../../core/game-engine/random';
import { moves, solveSort, topRun, type SortRules, type SortSpec } from './engine';
import { isValidSortState, move, newSort, type SortState } from './play';

export const MOVE_LIMIT = 300;

export function sortActions(s: SortState, rules: SortRules): string[] {
  return s.solved || s.history.length >= MOVE_LIMIT
    ? []
    : moves(s.tubes, rules).map(([a, b]) => `${a}>${b}`);
}

const plans = new Map<string, [number, number][]>();
export function solverStep(s: SortState, rules: SortRules): [number, number] | null {
  const key = JSON.stringify(s.tubes);
  let plan = plans.get(key);
  if (!plan) {
    plan = solveSort(s.tubes, rules).moves ?? [];
    if (plans.size > 200) plans.clear();
    plans.set(key, plan);
  }
  const first = plan[0];
  if (first) plans.set(JSON.stringify(applyPlan(s, rules, first)), plan.slice(1));
  return first ?? null;
}
const applyPlan = (s: SortState, rules: SortRules, [a, b]: [number, number]) =>
  move(s, rules, a, b).tubes;

export function greedyStep(s: SortState, rules: SortRules, rng: Rng): [number, number] {
  const last = s.history[s.history.length - 1];
  const all = moves(s.tubes, rules);
  // Never pour straight back (it only undoes the last move) unless nothing else is left.
  const fresh = all.filter(([a, b]) => !last || a !== last[1] || b !== last[0]);
  const options = fresh.length ? fresh : all;
  const score = ([a, b]: [number, number]) => {
    const to = s.tubes[b]!;
    const from = s.tubes[a]!;
    let v = rng.float();
    if (to.length && to.every((c) => c === to[0])) v += 5;
    if (!to.length) v -= 2;
    if (topRun(from) === from.length) v -= 3;
    return v;
  };
  return options.reduce((best, m) => (score(m) > score(best) ? m : best), options[0]!);
}

class SortAgent implements Agent<SortState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: SortState, rng: Rng) => [number, number],
  ) {}
  selectAction(
    _env: GameEnvironment<SortState, string>,
    s: SortState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    const [a, b] = this.pick(s, ctx.rng);
    return `${a}>${b}`;
  }
}

export function sortAgents(rules: (spec: SortSpec) => SortRules, specs: Record<string, SortSpec>) {
  const r = (s: SortState) => rules(specs[s.level]!);
  const presets: AgentPreset<SortState, string>[] = [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: { en: 'Makes any allowed move.', es: 'Hace cualquier movimiento permitido.' },
      create: () => new RandomAgent(),
    },
    {
      id: 'greedy',
      kind: 'heuristic',
      label: { en: 'Greedy sorter', es: 'Clasificador voraz' },
      description: {
        en: 'Moves onto tubes that already hold one color, avoiding empty tubes when it can and never pouring straight back.',
        es: 'Mueve a tubos que ya tienen un solo color, evita los vacíos cuando puede y nunca devuelve lo que acaba de mover.',
      },
      create: () => new SortAgent('greedy', 'Greedy sorter', (s, rng) => greedyStep(s, r(s), rng)),
    },
    {
      id: 'solver',
      kind: 'search',
      label: { en: 'Solver', es: 'Solucionador' },
      description: {
        en: 'Depth-first search that remembers dead positions: always finds a way when there is one.',
        es: 'Búsqueda en profundidad que recuerda las posiciones sin salida: siempre encuentra un camino si existe.',
      },
      create: () =>
        new SortAgent(
          'solver',
          'Solver',
          (s, rng) => solverStep(s, r(s)) ?? greedyStep(s, r(s), rng),
        ),
    },
  ];
  return presets;
}

export function sortOutcome(s: SortState): Outcome | null {
  if (!s.solved && s.history.length < MOVE_LIMIT) return null;
  return {
    returns: [s.solved ? 1 : 0],
    winners: s.solved ? [0] : [],
    draw: false,
    scores: [s.solved ? -s.history.length : 0],
    reason: s.solved ? 'sorted' : 'move-limit',
  };
}

export function createSortEnv(
  id: string,
  rulesetId: string,
  version: string,
  specs: Record<string, SortSpec>,
  rules: (spec: SortSpec) => SortRules,
): GameEnvironment<SortState, string, SortState, { level?: string }> {
  const first = Object.keys(specs)[0]!;
  const r = (s: SortState) => rules(specs[s.level]!);
  const legal = (s: SortState) => {
    const acts = sortActions(s, r(s));
    // No move left without being sorted: the episode ends (stuck).
    return acts;
  };
  const outcome = (s: SortState): Outcome | null =>
    sortOutcome(s) ??
    (legal(s).length
      ? null
      : { returns: [0], winners: [], draw: false, scores: [0], reason: 'stuck' });
  return {
    id,
    version,
    rulesetId,
    info: {
      kind: 'puzzle',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: false,
    },
    createInitialState: (config, seed) => newSort(specs, rules, config?.level ?? first, seed >>> 0),
    reset: (seed) => newSort(specs, rules, first, seed >>> 0),
    getObservation: (s) => s,
    getLegalActions: (s) => legal(s),
    applyAction: (s, a) => {
      if (!legal(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
      const [x, y] = a.split('>').map(Number) as [number, number];
      return move(s, r(s), x, y);
    },
    getCurrentPlayer: (s) => (outcome(s) ? NO_PLAYER : 0),
    isTerminal: (s) => outcome(s) !== null,
    getOutcome: outcome,
    getReward: (s) => outcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidSortState(parsed, specs, rules)) throw new Error('Invalid sorting state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}
