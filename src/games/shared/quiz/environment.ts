/**
 * AI environment for a bank of quizzes: one attempt per episode (config `{ quiz, lang }`).
 * Actions: `a:<item>` gives an item's answer (typing it, clicking its tile or its country),
 * `skip` moves a slideshow or prompt on, `give-up` ends the attempt. Every action spends three
 * seconds of the quiz clock, so episodes always end.
 */
import { RandomAgent } from '../../../ai/agents/random-agent';
import type { Agent, DecisionContext } from '../../../ai/agents/types';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import {
  IllegalActionError,
  NO_PLAYER,
  type GameEnvironment,
  type Outcome,
} from '../../../ai/protocols/types';
import type { Rng } from '../../../core/game-engine/random';
import {
  click,
  currentItem,
  giveUp,
  isValidAttempt,
  newAttempt,
  percent,
  sequential,
  skip,
  tick,
  typeAnswer,
  type Lang,
  type Quiz,
  type QuizState,
} from './engine';

export interface QuizConfig {
  quiz?: string;
  lang?: Lang;
}
export type QuizAction = `a:${number}` | 'skip' | 'give-up';

export function quizActions(q: Quiz, s: QuizState): QuizAction[] {
  if (s.status !== 'playing') return [];
  const out: QuizAction[] = [];
  if (sequential(q)) {
    const cur = currentItem(q, s);
    if (cur !== null) {
      if (q.format === 'slideshow') out.push(`a:${cur}`);
      else q.items.forEach((_, i) => !s.found[i] && out.push(`a:${i}`));
      out.push('skip');
    }
  } else {
    q.items.forEach((it, i) => {
      if (s.found[i]) return;
      if (q.format === 'pick' || it.correct !== false) out.push(`a:${i}`);
    });
  }
  out.push('give-up');
  return out;
}

export function applyQuiz(q: Quiz, s: QuizState, a: QuizAction): QuizState {
  if (!quizActions(q, s).includes(a)) throw new IllegalActionError(`Illegal action ${String(a)}`);
  let next: QuizState;
  if (a === 'give-up') return giveUp(s);
  if (a === 'skip') next = skip(q, s);
  else {
    const i = Number(a.slice(2));
    next =
      q.format === 'click' || q.format === 'pick' || q.format === 'map-click'
        ? click(q, s, i).state
        : typeAnswer(q, s, q.items[i]!.display[s.lang]).state;
  }
  return tick(q, next, 3000);
}

export function createQuizEnv(
  quizzes: readonly Quiz[],
  meta: { id: string; version: string; rulesetId: string },
): GameEnvironment<QuizState, QuizAction, QuizState, QuizConfig> {
  const byId = new Map(quizzes.map((q) => [q.id, q]));
  const quizOf = (s: QuizState) => byId.get(s.quizId)!;
  const outcome = (s: QuizState): Outcome | null => {
    if (s.status === 'playing') return null;
    const pct = percent(quizOf(s), s);
    return {
      returns: [pct / 100],
      winners: s.status === 'won' ? [0] : [],
      draw: false,
      scores: [pct],
      reason: s.status,
    };
  };
  const env: GameEnvironment<QuizState, QuizAction, QuizState, QuizConfig> = {
    ...meta,
    info: {
      kind: 'puzzle',
      minPlayers: 1,
      maxPlayers: 1,
      stochastic: false,
      hiddenInformation: false,
      zeroSum: false,
    },
    createInitialState: (c, seed) =>
      newAttempt(byId.get(c?.quiz ?? '') ?? quizzes[0]!, c?.lang ?? 'en', seed >>> 0),
    reset: (seed) => newAttempt(quizzes[0]!, 'en', seed >>> 0),
    getObservation: (s) => s,
    getLegalActions: (s) => quizActions(quizOf(s), s),
    applyAction: (s, a) => applyQuiz(quizOf(s), s, a),
    getCurrentPlayer: (s) => (s.status === 'playing' ? 0 : NO_PLAYER),
    isTerminal: (s) => s.status !== 'playing',
    getOutcome: outcome,
    getReward: (s) => outcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      const q = byId.get((parsed as QuizState)?.quizId);
      if (!q || !isValidAttempt(parsed, q)) throw new Error('Invalid quiz state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };
  return env;
}

/** Knows each answer with probability `knows`; answers what it knows, skips or gives up otherwise. */
export function knowerMove(q: Quiz, s: QuizState, rng: Rng, knows: number): QuizAction {
  const legal = quizActions(q, s);
  const answers = legal.filter((a) => a.startsWith('a:')) as `a:${number}`[];
  if (sequential(q)) {
    const cur = currentItem(q, s);
    if (cur !== null && rng.chance(knows)) return `a:${cur}`;
    return s.skipped > q.items.length * 2 ? 'give-up' : 'skip';
  }
  const right = answers.filter((a) => q.items[Number(a.slice(2))]!.correct !== false);
  if (right.length && rng.chance(knows)) return rng.pick(right);
  return rng.chance(0.15) || right.length === 0 ? 'give-up' : rng.pick(right);
}

class Knower implements Agent<QuizState, QuizAction> {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly quizzes: Map<string, Quiz>,
    private readonly knows: number,
  ) {}
  selectAction(
    _e: GameEnvironment<QuizState, QuizAction>,
    s: QuizState,
    _p: number,
    ctx: DecisionContext,
  ) {
    return knowerMove(this.quizzes.get(s.quizId)!, s, ctx.rng, this.knows);
  }
}

export function quizPresets(quizzes: readonly Quiz[]): AgentPreset<QuizState, QuizAction>[] {
  const byId = new Map(quizzes.map((q) => [q.id, q]));
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Any legal answer, skip or give up.',
        es: 'Cualquier respuesta, salto o rendición.',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'casual',
      kind: 'heuristic',
      label: { en: 'Casual quizzer', es: 'Concursante casual' },
      description: { en: 'Knows about half of the answers.', es: 'Sabe más o menos la mitad.' },
      create: () => new Knower('casual', 'Casual quizzer', byId, 0.5),
    },
    {
      id: 'expert',
      kind: 'heuristic',
      label: { en: 'Quiz expert', es: 'Experto en tests' },
      description: { en: 'Knows almost every answer.', es: 'Sabe casi todas las respuestas.' },
      create: () => new Knower('expert', 'Quiz expert', byId, 0.95),
    },
  ];
}
