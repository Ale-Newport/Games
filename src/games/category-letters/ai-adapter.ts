/**
 * The AI environment: one round for player 0 against bots (config `{ lang, bots, skill, size }`).
 * The list is filled in category order: each action names a known answer for the current category
 * (`a:<answer>`) or skips it; after the last category the round is scored (duplicates cancel).
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
import {
  DEFAULT_SETTINGS,
  candidates,
  categoryById,
  confirmRound,
  currentRound,
  isValidState,
  newGame,
  roundPoints,
  submitList,
  type CLState,
  type Lang,
  type Skill,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface CLConfig {
  lang?: Lang;
  bots?: number;
  skill?: Skill;
  size?: 6 | 9 | 12;
}

export type CLAction = `a:${string}` | 'skip';

export function clActions(s: CLState): CLAction[] {
  if (s.phase !== 'fill') return [];
  const round = currentRound(s);
  const cat = categoryById(round.categories[s.cursor]!);
  return [
    ...candidates(cat, s.settings.lang, round.letter).map((k) => `a:${k.name}` as CLAction),
    'skip',
  ];
}

export function applyCl(s: CLState, a: CLAction): CLState {
  if (!clActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const round = currentRound(s);
  const mine = [...round.answers[0]!];
  mine[s.cursor] = a === 'skip' ? '' : a.slice(2);
  const rounds = [
    ...s.rounds.slice(0, -1),
    { ...round, answers: round.answers.map((x, p) => (p === 0 ? mine : x)) },
  ];
  const next: CLState = { ...s, rounds, cursor: s.cursor + 1 };
  if (next.cursor < round.categories.length) return next;
  return confirmRound(submitList(next, mine));
}

export function clOutcome(s: CLState): Outcome | null {
  if (s.phase !== 'done') return null;
  const pts = roundPoints(s, 0);
  const best = Math.max(...pts);
  return {
    returns: [pts[0]! / currentRound(s).categories.length],
    winners: pts.flatMap((p, i) => (p === best ? [i] : [])).filter((i) => i === 0),
    draw: false,
    scores: [pts[0]!],
    reason: 'round-scored',
  };
}

export const clEnv: GameEnvironment<CLState, CLAction, CLState, CLConfig> = {
  id: 'category-letters',
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
    newGame(
      {
        ...DEFAULT_SETTINGS,
        lang: c?.lang ?? 'en',
        bots: c?.bots ?? 3,
        skill: c?.skill ?? 'normal',
        size: c?.size ?? 12,
        rounds: 1,
        humans: 1,
      },
      seed >>> 0,
      ['AI'],
    ),
  reset: (seed) => clEnv.createInitialState(undefined, seed),
  getObservation: (s) =>
    s.phase === 'fill'
      ? {
          ...s,
          rounds: s.rounds.map((r) => ({
            ...r,
            answers: r.answers.map((a, p) => (p === 0 ? a : a.map(() => '?'))),
          })),
        }
      : s,
  getLegalActions: clActions,
  applyAction: applyCl,
  getCurrentPlayer: (s) => (s.phase === 'fill' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.phase === 'done',
  getOutcome: clOutcome,
  getReward: (s) => clOutcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Category Letters state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

/** Picks a known answer weighted toward common (dup-prone) or rare (dup-safe) ones. */
export function pickAnswer(s: CLState, rng: Rng, preferRare: boolean): CLAction {
  const round = currentRound(s);
  const list = candidates(categoryById(round.categories[s.cursor]!), s.settings.lang, round.letter);
  const named = list.filter((k) => k.weight > 0);
  if (named.length === 0) return 'skip';
  const w = named.map((k) => (preferRare ? 1 / k.weight : k.weight));
  let r = rng.float() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < named.length; i++) {
    r -= w[i]!;
    if (r <= 0) return `a:${named[i]!.name}`;
  }
  return `a:${named.at(-1)!.name}`;
}

class ClAgent implements Agent<CLState, CLAction> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly rare: boolean,
  ) {}
  selectAction(
    _e: GameEnvironment<CLState, CLAction>,
    s: CLState,
    _p: number,
    ctx: DecisionContext,
  ) {
    return pickAnswer(s, ctx.rng, this.rare);
  }
}

export const AGENT_PRESETS: AgentPreset<CLState, CLAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Any known answer, or a blank.',
      es: 'Cualquier respuesta conocida o en blanco.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'obvious',
    kind: 'heuristic',
    label: { en: 'Obvious answers', es: 'Respuestas obvias' },
    description: {
      en: 'Writes the most familiar answers — and collides with the bots.',
      es: 'Escribe las respuestas más conocidas, y coincide con los bots.',
    },
    create: () => new ClAgent('obvious', 'Obvious answers', false),
  },
  {
    id: 'original',
    kind: 'heuristic',
    label: { en: 'Original thinker', es: 'Pensador original' },
    description: {
      en: 'Prefers rare answers that nobody else will write.',
      es: 'Prefiere respuestas raras que nadie más escribirá.',
    },
    create: () => new ClAgent('original', 'Original thinker', true),
  },
];

export const bundle: AiBundle<CLState, CLAction> = {
  env: clEnv as unknown as AiBundle<CLState, CLAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
