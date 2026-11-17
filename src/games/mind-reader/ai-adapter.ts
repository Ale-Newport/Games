/**
 * The AI environment, from the guesser's side: a hidden entity is drawn from a domain and answers
 * questions truthfully. Actions: ask a question (`q:ID`) or guess an entity (`g:ID`). Three wrong
 * guesses or 45 questions end the episode. Reward: 1 − questions/50 for a right guess, else 0.
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
import { bestQuestion, ranked, type Answer } from './engine';
import { DOMAINS, DOMAIN_IDS, type Domain } from './knowledge';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export interface Hunt {
  domain: Domain['id'];
  secret: string;
  answers: { q: string; a: Answer }[];
  rejected: string[];
  won: boolean;
}

const done = (h: Hunt) => h.won || h.rejected.length >= 3 || h.answers.length >= 45;

export function huntActions(h: Hunt): string[] {
  if (done(h)) return [];
  const d = DOMAINS[h.domain];
  const asked = new Set(h.answers.map((x) => x.q));
  return [
    ...d.questions.filter((q) => !asked.has(q.id)).map((q) => `q:${q.id}`),
    ...d.entities.filter((e) => !h.rejected.includes(e.id)).map((e) => `g:${e.id}`),
  ];
}

function outcome(h: Hunt): Outcome | null {
  if (!done(h)) return null;
  const r = h.won ? 1 - h.answers.length / 50 : 0;
  return {
    returns: [r],
    winners: h.won ? [0] : [],
    draw: false,
    scores: [h.answers.length],
    reason: h.won ? 'guessed' : 'gave-up',
  };
}

export const env: GameEnvironment<Hunt, string, Hunt, { domain?: Domain['id'] }> = {
  id: 'mind-reader',
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
  createInitialState: (c, seed) => {
    const rng = new Rng(seed >>> 0);
    const domain = c?.domain ?? rng.pick(DOMAIN_IDS);
    return {
      domain,
      secret: rng.pick(DOMAINS[domain].entities).id,
      answers: [],
      rejected: [],
      won: false,
    };
  },
  reset: (seed) => env.createInitialState(undefined, seed),
  getObservation: (h) => h,
  getLegalActions: huntActions,
  applyAction: (h, a) => {
    if (!huntActions(h).includes(a)) throw new IllegalActionError(`Illegal action ${a}`);
    const id = a.slice(2);
    if (a.startsWith('g:'))
      return id === h.secret ? { ...h, won: true } : { ...h, rejected: [...h.rejected, id] };
    const secret = DOMAINS[h.domain].entities.find((e) => e.id === h.secret)!;
    return { ...h, answers: [...h.answers, { q: id, a: secret.tags.includes(id) ? 'yes' : 'no' }] };
  },
  getCurrentPlayer: (h) => (done(h) ? NO_PLAYER : 0),
  isTerminal: done,
  getOutcome: outcome,
  getReward: (h) => outcome(h)?.returns[0] ?? 0,
  serializeState: (h) => JSON.stringify(h),
  deserializeState: (data) => {
    const h = JSON.parse(data) as Hunt;
    if (!h || !(h.domain in DOMAINS) || !Array.isArray(h.answers))
      throw new Error('Invalid Mind Reader state');
    return h;
  },
  cloneState: (h) => structuredClone(h),
  actionToString: (a) => a,
};

/** The game's own reasoner, choosing questions by information gain. */
export function reasonerAction(h: Hunt): string {
  const s = {
    domain: h.domain,
    answers: h.answers,
    rejected: h.rejected,
    phase: 'asking' as const,
    question: null,
    guess: null,
  };
  const top = ranked(s)[0]!;
  const q = bestQuestion(s);
  if (top[1] > 0.8 || !q) return `g:${top[0]}`;
  return `q:${q}`;
}

class Reasoner implements Agent<Hunt, string> {
  readonly id = 'reasoner';
  readonly label = 'Reasoner';
  selectAction(_e: GameEnvironment<Hunt, string>, h: Hunt, _p: number, _ctx: DecisionContext) {
    return reasonerAction(h);
  }
}

export const AGENT_PRESETS: AgentPreset<Hunt, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Random questions and guesses.', es: 'Preguntas y apuestas al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'reasoner',
    kind: 'heuristic',
    label: { en: 'Reasoner', es: 'Razonador' },
    description: {
      en: 'The mind reader itself: Bayesian odds, the most informative question, a guess when one answer is clearly ahead.',
      es: 'El propio adivino: probabilidades bayesianas, la pregunta más informativa y una apuesta cuando una respuesta destaca.',
    },
    create: () => new Reasoner(),
  },
];

export const bundle: AiBundle<Hunt, string> = {
  env: env as unknown as AiBundle<Hunt, string>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
