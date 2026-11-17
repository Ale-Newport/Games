/**
 * The AI environment trains the guesser's side: a real human doodle (Quick Draw, CC BY 4.0) is
 * revealed in ten steps; at each step the agent may `wait` or guess a word (`g:<word>`). A right
 * guess scores more the earlier it comes; a wrong guess costs 0.1. Config `{ word? }`.
 * Doodles and the recognizer load before the bundle is returned.
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
import { WORDS } from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DOODLES = await loadDoodles();
export const MODEL = await loadModel();
const DRAWABLE = WORDS.filter((w) => (DOODLES[w] ?? []).length > 0);
export const STEPS = 10;

export interface GuessState {
  word: string;
  doodle: Stroke[];
  step: number;
  wrong: number;
  status: 'playing' | 'right' | 'missed';
}

export type GuessAction = 'wait' | `g:${string}`;

export const visible = (s: GuessState) => partialStrokes(s.doodle, s.step / STEPS);

function create(word: string | undefined, seed: number): GuessState {
  const rng = new Rng(seed >>> 0);
  const w = word && DRAWABLE.includes(word) ? word : rng.pick(DRAWABLE);
  return { word: w, doodle: rng.pick(DOODLES[w]!), step: 1, wrong: 0, status: 'playing' };
}

export const guessActions = (s: GuessState): GuessAction[] =>
  s.status !== 'playing'
    ? []
    : [
        ...(s.step < STEPS ? (['wait'] as GuessAction[]) : []),
        ...WORDS.map((w) => `g:${w}` as GuessAction),
      ];

export function applyGuess(s: GuessState, a: GuessAction): GuessState {
  if (!guessActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  if (a === 'wait') return { ...s, step: s.step + 1 };
  if (a.slice(2) === s.word) return { ...s, status: 'right' };
  const wrong = s.wrong + 1;
  return s.step >= STEPS && wrong >= 3
    ? { ...s, wrong, status: 'missed' }
    : { ...s, wrong, step: Math.min(STEPS, s.step + 1) };
}

function outcome(s: GuessState): Outcome | null {
  if (s.status === 'playing') return null;
  const r = s.status === 'right' ? Math.max(0.1, 1.1 - s.step / STEPS - 0.1 * s.wrong) : 0;
  return {
    returns: [r],
    winners: s.status === 'right' ? [0] : [],
    draw: false,
    scores: [s.step],
    reason: s.status,
  };
}

export const env: GameEnvironment<GuessState, GuessAction, GuessState, { word?: string }> = {
  id: 'sketch-guess',
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
  createInitialState: (c, seed) => create(c?.word, seed),
  reset: (seed) => create(undefined, seed),
  getObservation: (s) => ({
    ...s,
    word: s.status === 'playing' ? '?' : s.word,
    doodle: visible(s),
  }),
  getLegalActions: guessActions,
  applyAction: applyGuess,
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status !== 'playing',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => JSON.parse(data) as GuessState,
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

/** Guesses the recognizer's top word once it is confident enough (or at the last step). */
export function recognizerMove(s: GuessState, threshold: number): GuessAction {
  const shown = visible(s);
  const top = shown.length ? classify(MODEL, shown, 3) : [];
  const best = top.find((g) => guessActions(s).includes(`g:${g.label}`));
  if (best && (best.p >= threshold || s.step >= STEPS)) return `g:${best.label}`;
  return s.step < STEPS ? 'wait' : `g:${WORDS[0]!}`;
}

class Recognizer implements Agent<GuessState, GuessAction> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly threshold: number,
  ) {}
  selectAction(
    _e: GameEnvironment<GuessState, GuessAction>,
    s: GuessState,
    _p: number,
    _c: DecisionContext,
  ) {
    return recognizerMove(s, this.threshold);
  }
}

export const AGENT_PRESETS: AgentPreset<GuessState, GuessAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Waits or guesses any word.', es: 'Espera o prueba cualquier palabra.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'careful',
    kind: 'heuristic',
    label: { en: 'Careful recognizer', es: 'Reconocedor prudente' },
    description: {
      en: 'Guesses once the recognizer is 70% sure.',
      es: 'Adivina cuando el reconocedor está seguro al 70 %.',
    },
    create: () => new Recognizer('careful', 'Careful recognizer', 0.7),
  },
  {
    id: 'eager',
    kind: 'heuristic',
    label: { en: 'Eager recognizer', es: 'Reconocedor impaciente' },
    description: { en: 'Guesses at 35% confidence.', es: 'Adivina con un 35 % de confianza.' },
    create: () => new Recognizer('eager', 'Eager recognizer', 0.35),
  },
];

export const bundle: AiBundle<GuessState, GuessAction> = {
  env: env as unknown as AiBundle<GuessState, GuessAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
