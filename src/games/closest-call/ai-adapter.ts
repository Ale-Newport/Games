/**
 * The AI environment: a full Closest Call game for 2–4 contestants (config `{ players }`,
 * default 2). Actions are answers on the round's log scale: action k → 10^(scale start + 0.02·k).
 * Every contestant sees the question, the answers already given this round and the scores — never
 * the true value. Returns: +1 for the sole winner, 0 for a shared top score, −1 otherwise (the
 * points are in `scores`).
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
import mag from '../order-of-magnitude/questions.json';
import rough from '../rough-guess/data.json';
import { domain, question, type Bank } from '../rough-guess/engine';
import {
  botGuess,
  currentRound,
  guess,
  isGame,
  newGame,
  nextRound,
  turn,
  winners,
  type Game,
  type Level,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const BANK = { rough, mag } as unknown as Bank;
const STEP = 0.02;

export interface Config {
  players?: number;
}

export interface Observation {
  round: number;
  key: string;
  kind: string;
  subject: string;
  year: number;
  domain: [number, number];
  /** Answers given so far this round (null = not yet), by seat. */
  guesses: (number | null)[];
  scores: number[];
  me: number;
}

export function observe(g: Game, player: number): Observation {
  const r = currentRound(g);
  const q = question(BANK, r.key);
  return {
    round: g.rounds.length - 1,
    key: q.key,
    kind: q.kind,
    subject: q.subject.en,
    year: q.year,
    domain: domain(BANK, q),
    guesses: [...r.guesses],
    scores: [...g.scores],
    me: player,
  };
}

const steps = (d: [number, number]) => Math.floor((d[1] - d[0]) / STEP + 1e-9);
export const actionValue = (d: [number, number], a: number) => Math.pow(10, d[0] + STEP * a);
export const nearestAction = (d: [number, number], v: number) =>
  Math.max(0, Math.min(steps(d), Math.round((Math.log10(v) - d[0]) / STEP)));

/** Plays the round transitions so every state handed to an agent has someone due to answer. */
function advance(g: Game): Game {
  return g.status === 'playing' && turn(g) < 0 ? nextRound(g, BANK) : g;
}

function outcome(g: Game): Outcome | null {
  if (g.status !== 'done') return null;
  const w = winners(g);
  const draw = w.length > 1;
  // +1 for the sole winner, 0 for players sharing the top score, −1 otherwise; points in scores.
  const returns = g.scores.map((_, i) => (w.includes(i) ? (draw ? 0 : 1) : -1));
  return { returns, winners: w, draw, scores: [...g.scores], reason: 'rounds' };
}

const seats = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, bot: null as Level | null }));

export const env: GameEnvironment<Game, number, Observation, Config> = {
  id: 'closest-call',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'turn-based',
    minPlayers: 2,
    maxPlayers: 4,
    stochastic: true,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    newGame(BANK, seats(Math.max(2, Math.min(4, c?.players ?? 2))), seed >>> 0),
  reset: (seed) => newGame(BANK, seats(2), seed >>> 0),
  getObservation: (g, p) => observe(g, p),
  getLegalActions: (g) => {
    if (g.status !== 'playing' || turn(g) < 0) return [];
    const d = domain(BANK, question(BANK, currentRound(g).key));
    return Array.from({ length: steps(d) + 1 }, (_, i) => i);
  },
  applyAction: (g, a) => {
    if (g.status !== 'playing' || turn(g) < 0)
      throw new IllegalActionError('Nobody is due to answer');
    const d = domain(BANK, question(BANK, currentRound(g).key));
    if (!Number.isInteger(a) || a < 0 || a > steps(d))
      throw new IllegalActionError(`Illegal action ${String(a)}`);
    return advance(guess(g, BANK, actionValue(d, a)));
  },
  getCurrentPlayer: (g) => (g.status !== 'playing' ? NO_PLAYER : turn(g)),
  isTerminal: (g) => g.status === 'done',
  getOutcome: outcome,
  getReward: (g, p) => outcome(g)?.returns[p] ?? 0,
  serializeState: (g) => JSON.stringify(g),
  deserializeState: (d) => {
    const parsed: unknown = JSON.parse(d);
    if (!isGame(parsed)) throw new Error('Invalid Closest Call game');
    return parsed;
  },
  cloneState: (g) => structuredClone(g),
  actionToString: (a) => `answer#${a}`,
};

class Contestant implements Agent<Game, number> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(_e: GameEnvironment<Game, number>, g: Game, _p: number, ctx: DecisionContext) {
    const d = domain(BANK, question(BANK, currentRound(g).key));
    return nearestAction(d, botGuess(g, BANK, this.level, ctx.rng));
  }
}

const preset = (
  level: Level,
  en: string,
  es: string,
  den: string,
  des: string,
): AgentPreset<Game, number> => ({
  id: level,
  kind: level === 'easy' ? 'heuristic' : 'search',
  label: { en, es },
  description: { en: den, es: des },
  create: () => new Contestant(level, en, level),
});

export const AGENT_PRESETS: AgentPreset<Game, number>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any answer on the scale.', es: 'Cualquier respuesta de la escala.' },
    create: () => new RandomAgent(),
  },
  preset(
    'easy',
    'Easy contestant',
    'Concursante fácil',
    'Answers a random value around what is typical for this kind of question.',
    'Responde un valor al azar en torno a lo típico para ese tipo de pregunta.',
  ),
  preset(
    'normal',
    'Normal contestant',
    'Concursante normal',
    'Knows what is typical for each kind of question and picks the answer with the best expected points against the answers already given.',
    'Sabe qué es típico para cada tipo de pregunta y elige la respuesta con más puntos esperados frente a las ya dadas.',
  ),
  preset(
    'hard',
    'Hard contestant',
    'Concursante difícil',
    'Reasons like an expert from related facts (neighbouring years of a price, neighbouring elements) and plays the same expected-points strategy.',
    'Razona como un experto con datos relacionados (años vecinos de un precio, elementos vecinos) y juega la misma estrategia de puntos esperados.',
  ),
];

export const bundle: AiBundle<Game, number> = {
  env: env as unknown as AiBundle<Game, number>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
