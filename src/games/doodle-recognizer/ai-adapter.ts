/**
 * The AI environment plays the recognizer's side: six real human doodles (Quick Draw, CC BY 4.0)
 * are drawn in ten steps each (two seconds of the round per step). At each step the agent may
 * `wait` or name a word (`g:<word>`); naming the right word wins the round at once, and the round
 * is lost when its time runs out. Reward: rounds won. Doodles and the network load first.
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
import { Rng } from '../../core/game-engine/random';
import { classify, loadDoodles, loadModel, type Stroke } from '../shared/doodle/doodle';
import { partialStrokes } from '../shared/doodle/Sketchpad';
import { ROUNDS, WORDS } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DOODLES = await loadDoodles();
export const MODEL = await loadModel();
const DRAWABLE = WORDS.filter((w) => (DOODLES[w] ?? []).length > 0);
export const STEPS = 10;

export interface Show {
  words: string[];
  doodles: Stroke[][];
  round: number;
  step: number;
  won: boolean[];
}

export const shown = (s: Show) => partialStrokes(s.doodles[s.round] ?? [], s.step / STEPS);
const done = (s: Show) => s.round >= ROUNDS;

function create(seed: number): Show {
  const rng = new Rng(seed >>> 0);
  const words = rng.shuffle([...DRAWABLE]).slice(0, ROUNDS);
  return { words, doodles: words.map((w) => rng.pick(DOODLES[w]!)), round: 0, step: 1, won: [] };
}

const nextRound = (s: Show, won: boolean): Show => ({
  ...s,
  round: s.round + 1,
  step: 1,
  won: [...s.won, won],
});

export const showActions = (s: Show): string[] =>
  done(s) ? [] : ['wait', ...WORDS.map((w) => `g:${w}`)];

function outcome(s: Show): Outcome | null {
  if (!done(s)) return null;
  const n = s.won.filter(Boolean).length;
  return { returns: [n], winners: [0], draw: false, scores: [n], reason: 'rounds' };
}

export const env: GameEnvironment<Show, string, Show, Record<string, never>> = {
  id: 'doodle-recognizer',
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
  createInitialState: (_c, seed) => create(seed),
  reset: (seed) => create(seed),
  getObservation: (s) => ({
    ...s,
    words: s.words.map((w, i) => (i < s.round ? w : '?')),
    doodles: [shown(s)],
  }),
  getLegalActions: showActions,
  applyAction: (s, a) => {
    if (!showActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    if (a.startsWith('g:') && a.slice(2) === s.words[s.round]) return nextRound(s, true);
    if (s.step >= STEPS) return nextRound(s, false);
    return { ...s, step: s.step + 1 };
  },
  getCurrentPlayer: (s) => (done(s) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => JSON.parse(data) as Show,
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

/** The game's own recognizer: names its top guess every step. */
export function networkAction(s: Show): string {
  const strokes = shown(s);
  if (!strokes.length) return 'wait';
  return `g:${classify(MODEL, strokes, 1)[0]!.label}`;
}

class Network implements Agent<Show, string> {
  readonly id = 'network';
  readonly label = 'Recognizer network';
  selectAction(_e: GameEnvironment<Show, string>, s: Show, _p: number, _c: DecisionContext) {
    return networkAction(s);
  }
}

export const AGENT_PRESETS: AgentPreset<Show, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Waits or names any word.', es: 'Espera o dice cualquier palabra.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'network',
    kind: 'heuristic',
    label: { en: 'Recognizer network', es: 'Red reconocedora' },
    description: {
      en: 'The game’s neural network (trained on real doodles) names its top guess at every step.',
      es: 'La red neuronal del juego (entrenada con dibujos reales) dice su mejor apuesta en cada paso.',
    },
    create: () => new Network(),
  },
];

export const bundle: AiBundle<Show, string> = {
  env: env as unknown as AiBundle<Show, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
