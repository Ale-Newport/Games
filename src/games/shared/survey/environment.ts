/**
 * AI environment and baseline agents for the survey games. One episode is a solo run of seven
 * prompts (config `{ lang, kind }`); each action is an accepted answer (`e:<index>`) or `timeout`.
 * Agents model players with different knowledge: they "know" an answer with a probability that
 * falls with its rarity, then pick by their own strategy among what they know.
 */
import type { Agent, DecisionContext } from '../../../ai/agents/types';
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { Rng } from '../../../core/game-engine/random';
import {
  BAND_POINTS,
  applyAction,
  currentSheet,
  isValidSurveyState,
  legalActions,
  maxScore,
  newRun,
  playerScore,
  type Lang,
  type Polarity,
  type SurveyAction,
  type SurveyState,
} from './engine';
import type { Band } from './sheets';

export interface SurveyConfig {
  lang?: Lang;
  /** A daily run for this YYYYMMDD key instead of a random set. */
  day?: number;
}

/** Probability that a player of a given breadth knows an answer of each band. */
const KNOW: Record<'casual' | 'buff', Record<Band, number>> = {
  casual: { a: 0.95, b: 0.7, c: 0.75, d: 0.35, e: 0.08, f: 0.01 },
  buff: { a: 1, b: 0.95, c: 0.95, d: 0.8, e: 0.45, f: 0.15 },
};

function knownEntries(s: SurveyState, rng: Rng, breadth: 'casual' | 'buff'): number[] {
  const known: number[] = [];
  currentSheet(s).entries.forEach((e, i) => {
    if (rng.chance(KNOW[breadth][e.band])) known.push(i);
  });
  return known;
}

/** Picks the best-scoring answer among those the agent knows (ties broken at random). */
export function knowledgeMove(s: SurveyState, rng: Rng, breadth: 'casual' | 'buff'): SurveyAction {
  const known = knownEntries(s, rng, breadth);
  if (known.length === 0) return 'timeout';
  const sheet = currentSheet(s);
  const pts = (i: number) => BAND_POINTS[s.polarity][sheet.entries[i]!.band];
  const top = Math.max(...known.map(pts));
  return `e:${rng.pick(known.filter((i) => pts(i) === top))}`;
}

/** The first answer that comes to mind: the most familiar answer the agent knows. */
export function firstThoughtMove(s: SurveyState, rng: Rng): SurveyAction {
  const known = knownEntries(s, rng, 'casual');
  if (known.length === 0) return 'timeout';
  const order = 'abcdef';
  const sheet = currentSheet(s);
  const best = Math.min(...known.map((i) => order.indexOf(sheet.entries[i]!.band)));
  return `e:${rng.pick(known.filter((i) => order.indexOf(sheet.entries[i]!.band) === best))}`;
}

class SurveyAgent implements Agent<SurveyState, SurveyAction> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: SurveyState, rng: Rng) => SurveyAction,
  ) {}
  selectAction(
    _env: GameEnvironment<SurveyState, SurveyAction>,
    s: SurveyState,
    _player: number,
    ctx: DecisionContext,
  ): SurveyAction {
    return this.move(s, ctx.rng);
  }
}

export function surveyOutcome(s: SurveyState): Outcome | null {
  if (s.status !== 'done') return null;
  const score = playerScore(s, 0);
  return {
    returns: [score / maxScore()],
    winners: [0],
    draw: false,
    scores: [score],
    reason: 'run-complete',
  };
}

export function createSurveyEnv(
  polarity: Polarity,
  meta: { id: string; version: string; rulesetId: string },
): GameEnvironment<SurveyState, SurveyAction, SurveyState, SurveyConfig> {
  const create = (config: SurveyConfig | undefined, seed: number) =>
    newRun({
      polarity,
      lang: config?.lang ?? 'en',
      kind: config?.day ? 'daily' : 'unlimited',
      day: config?.day,
      seed: seed >>> 0,
    });
  return {
    ...meta,
    info: {
      kind: 'puzzle',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: false,
    },
    createInitialState: create,
    reset: (seed) => create(undefined, seed),
    getObservation: (s) => s,
    getLegalActions: legalActions,
    applyAction: (s, a) => {
      if (!legalActions(s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
      return applyAction(s, a);
    },
    getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
    isTerminal: (s) => s.status === 'done',
    getOutcome: surveyOutcome,
    getReward: (s) => surveyOutcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidSurveyState(parsed)) throw new Error('Invalid survey state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
}

export function surveyPresets(): AgentPreset<SurveyState, SurveyAction>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Any answer on the sheet, or lets the clock run out.',
        es: 'Cualquier respuesta de la hoja, o deja correr el reloj.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'first-thought',
      kind: 'heuristic',
      label: { en: 'First thought', es: 'Lo primero que piensa' },
      description: {
        en: 'Says the most familiar answer it knows.',
        es: 'Dice la respuesta más conocida que sabe.',
      },
      create: () => new SurveyAgent('first-thought', 'First thought', firstThoughtMove),
    },
    {
      id: 'casual',
      kind: 'heuristic',
      label: { en: 'Casual player', es: 'Jugador casual' },
      description: {
        en: 'Knows common answers; picks the best-scoring one it knows.',
        es: 'Sabe las respuestas comunes y elige la que más puntúa.',
      },
      create: () =>
        new SurveyAgent('casual', 'Casual player', (s, r) => knowledgeMove(s, r, 'casual')),
    },
    {
      id: 'trivia-buff',
      kind: 'heuristic',
      label: { en: 'Trivia buff', es: 'Experto en trivia' },
      description: {
        en: 'Knows many rare answers; picks the best-scoring one it knows.',
        es: 'Sabe muchas respuestas raras y elige la que más puntúa.',
      },
      create: () =>
        new SurveyAgent('trivia-buff', 'Trivia buff', (s, r) => knowledgeMove(s, r, 'buff')),
    },
  ];
}
