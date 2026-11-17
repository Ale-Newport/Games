/**
 * The AI environment plays a whole telephone chain among bots and scores how well the message
 * survives: the agent describes every drawing in the chain (actions `d:<word>`, a drawable word),
 * the built-in bot draws every description. Reward: the share of describe steps whose word matches
 * the chain's original subject. Config `{ length? }` (3–8 players).
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
import { CLASSES, classify, loadDoodles, loadModel, type Stroke } from '../shared/doodle/doodle';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const DOODLES = await loadDoodles();
export const MODEL = await loadModel();

export interface ChainState {
  subject: string;
  /** Words described so far (one per describe step). */
  described: string[];
  /** The drawing the agent must describe now. */
  drawing: Stroke[];
  steps: number;
  seed: number;
  status: 'playing' | 'done';
}
export type ChainAction = `d:${string}`;

function drawingOf(word: string, seed: number): Stroke[] {
  const list = DOODLES[word] ?? [];
  return list.length ? new Rng(seed >>> 0).pick(list) : [];
}

function create(length: number, seed: number): ChainState {
  const rng = new Rng(seed >>> 0);
  const subject = rng.pick(CLASSES.filter((c) => (DOODLES[c] ?? []).length));
  const steps = Math.floor((Math.max(3, Math.min(8, length)) - 1) / 2);
  return {
    subject,
    described: [],
    drawing: drawingOf(subject, seed),
    steps: Math.max(1, steps),
    seed: seed >>> 0,
    status: 'playing',
  };
}

export const chainActions = (s: ChainState): ChainAction[] =>
  s.status === 'playing' ? CLASSES.map((c) => `d:${c}` as ChainAction) : [];

export function applyChain(s: ChainState, a: ChainAction): ChainState {
  if (!chainActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  const word = a.slice(2);
  const described = [...s.described, word];
  if (described.length >= s.steps) return { ...s, described, status: 'done' };
  return { ...s, described, drawing: drawingOf(word, s.seed + described.length * 31) };
}

function outcome(s: ChainState): Outcome | null {
  if (s.status !== 'done') return null;
  const kept = s.described.filter((w) => w === s.subject).length / s.described.length;
  return {
    returns: [kept],
    winners: kept === 1 ? [0] : [],
    draw: false,
    scores: [kept],
    reason: 'album',
  };
}

export const env: GameEnvironment<ChainState, ChainAction, ChainState, { length?: number }> = {
  id: 'draw-telephone',
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
  createInitialState: (c, seed) => create(c?.length ?? 6, seed),
  reset: (seed) => create(6, seed),
  getObservation: (s) => ({ ...s, subject: s.status === 'playing' ? '?' : s.subject }),
  getLegalActions: chainActions,
  applyAction: applyChain,
  getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status === 'done',
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => JSON.parse(data) as ChainState,
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a.slice(2),
};

class Describer implements Agent<ChainState, ChainAction> {
  readonly id = 'recognizer';
  readonly label = 'Recognizer';
  selectAction(
    _e: GameEnvironment<ChainState, ChainAction>,
    s: ChainState,
    _p: number,
    _c: DecisionContext,
  ): ChainAction {
    return `d:${classify(MODEL, s.drawing, 1)[0]?.label ?? CLASSES[0]!}`;
  }
}

export const AGENT_PRESETS: AgentPreset<ChainState, ChainAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Describes drawings with any word.',
      es: 'Describe los dibujos con cualquier palabra.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'recognizer',
    kind: 'heuristic',
    label: { en: 'Recognizer', es: 'Reconocedor' },
    description: {
      en: 'Describes each drawing with the recognizer’s best guess.',
      es: 'Describe cada dibujo con la mejor respuesta del reconocedor.',
    },
    create: () => new Describer(),
  },
];

export const bundle: AiBundle<ChainState, ChainAction> = {
  env: env as unknown as AiBundle<ChainState, ChainAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
