/**
 * The AI environment: one round against four bots. The agent picks its caption from a menu of
 * lines (`c:<index>`: the scene's own bank plus lines written for other scenes); the bots then
 * caption and everyone rates. Reward: the agent's average stars received / 5. Config `{ lang? }`.
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
import {
  botCaption,
  botRating,
  isValidState,
  newGame,
  round,
  setCaption,
  setRating,
  type BattleState,
} from './engine';
import { SCENES } from './scenes';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export type CaptionAction = `c:${number}`;

/** The caption menu offered to the agent in this round. */
export function menu(s: BattleState): string[] {
  const own = SCENES.find((x) => x.id === round(s).scene)!.captions[s.lang];
  const others = SCENES.filter((x) => x.id !== round(s).scene).map((x) => x.captions[s.lang][0]!);
  return [...own, ...others.slice(0, 4), 'lol'];
}

export const captionActions = (s: BattleState): CaptionAction[] =>
  s.phase !== 'caption' || round(s).captions[0] !== null
    ? []
    : menu(s).map((_, i) => `c:${i}` as CaptionAction);

/** Plays the round to the end once the agent has captioned. */
export function playOut(s: BattleState): BattleState {
  let n = s;
  n.players.forEach((_, i) => {
    if (i > 0 && round(n).captions[i] === null) n = setCaption(n, i, botCaption(n, i));
  });
  n.players.forEach((_, i) =>
    n.players.forEach((__, a) => {
      if (i !== a) n = setRating(n, i, a, i === 0 ? 3 : botRating(n, i, a));
    }),
  );
  return n;
}

function outcome(s: BattleState): Outcome | null {
  if (s.phase !== 'results') return null;
  const r = round(s);
  const got = r.ratings.slice(1).map((row) => row[0] ?? 0);
  const avg = got.reduce((a, b) => a + b, 0) / got.length;
  return { returns: [avg / 5], winners: [], draw: false, scores: [avg], reason: 'rated' };
}

export const env: GameEnvironment<BattleState, CaptionAction, BattleState, { lang?: 'en' | 'es' }> =
  {
    id: 'caption-battle',
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
    createInitialState: (c, seed) => newGame(c?.lang ?? 'en', ['agent'], 4, 1, seed),
    reset: (seed) => newGame('en', ['agent'], 4, 1, seed),
    getObservation: (s) => s,
    getLegalActions: captionActions,
    applyAction: (s, a) => {
      if (!captionActions(s).includes(a))
        throw new IllegalActionError(`Illegal action ${String(a)}`);
      return playOut(setCaption(s, 0, menu(s)[Number(a.slice(2))]!));
    },
    getCurrentPlayer: (s) => (s.phase === 'caption' ? 0 : NO_PLAYER),
    isTerminal: (s) => s.phase !== 'caption',
    getOutcome: outcome,
    getReward: (s) => outcome(s)?.returns[0] ?? 0,
    serializeState: (s) => JSON.stringify(s),
    deserializeState: (data) => {
      const parsed: unknown = JSON.parse(data);
      if (!isValidState(parsed)) throw new Error('Invalid Caption Battle state');
      return parsed;
    },
    cloneState: (s) => structuredClone(s),
    actionToString: (a) => a,
  };

/** Chooses the line the bots are predicted to rate highest. */
export function crowdPleaser(s: BattleState): CaptionAction {
  const options = menu(s);
  let best = 0;
  let bestScore = -Infinity;
  options.forEach((line, i) => {
    const trial = setCaption(s, 0, line);
    const score = trial.players.reduce(
      (sum, _p, r) => sum + (r === 0 ? 0 : botRating(trial, r, 0)),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return `c:${best}`;
}

class Pleaser implements Agent<BattleState, CaptionAction> {
  readonly id = 'crowd-pleaser';
  readonly label = 'Crowd pleaser';
  selectAction(
    _e: GameEnvironment<BattleState, CaptionAction>,
    s: BattleState,
    _p: number,
    _c: DecisionContext,
  ) {
    return crowdPleaser(s);
  }
}

export const AGENT_PRESETS: AgentPreset<BattleState, CaptionAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Picks any line.', es: 'Elige cualquier frase.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'crowd-pleaser',
    kind: 'heuristic',
    label: { en: 'Crowd pleaser', es: 'Complaciente' },
    description: {
      en: 'Picks the line the bots will like most.',
      es: 'Elige la frase que más gustará a los bots.',
    },
    create: () => new Pleaser(),
  },
];

export const bundle: AiBundle<BattleState, CaptionAction> = {
  env: env as unknown as AiBundle<BattleState, CaptionAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
