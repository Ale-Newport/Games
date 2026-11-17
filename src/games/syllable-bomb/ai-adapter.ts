/**
 * The AI environment: the agent (seat 0) against two bots. On its turn the agent plays any valid
 * unused word containing the prompt (`w:<word>`; the legal list is a sample of up to 300), which costs thinking time (1.5 s + 0.15 s per
 * letter) off the fuse, or `stall` (2 s). Bot turns run inside the environment. Reward 1 for
 * outlasting both bots. Config `{ difficulty? }`.
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
import { loadWordList } from '../shared/semantic/semantic';
import { botPlan } from './bots';
import { loadWords, wordsWith } from './dictionary';
import {
  BONUS_LETTERS,
  burn,
  isValidState,
  newGame,
  playWord,
  wordProblem,
  type BombState,
  type Difficulty,
} from './engine';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const ALL = await loadWords();
export const COMMON = (await loadWordList()).filter((w) => /^[a-z]{3,15}$/.test(w));
const DICT = new Set(ALL);

export type BombAction = `w:${string}` | 'stall';

function botsMove(s: BombState): BombState {
  let n = s;
  for (let guard = 0; guard < 500 && n.status === 'playing' && n.holder !== 0; guard++) {
    const rng = new Rng((n.turns * 7919 + n.used.length * 31 + Math.round(n.fuse * 100)) >>> 0);
    const plan = botPlan(n, COMMON, ALL, rng);
    const burnt = burn(n, plan.seconds);
    if (
      burnt.event?.kind === 'boom' &&
      burnt !== n &&
      burnt.players[n.holder]!.lives < n.players[n.holder]!.lives
    ) {
      n = burnt;
      continue;
    }
    n = plan.word ? playWord(burnt, plan.word) : burnt;
  }
  return n;
}

export const bombActions = (s: BombState): BombAction[] =>
  s.status !== 'playing' || s.holder !== 0
    ? []
    : [
        ...wordsWith(ALL, s.prompt, s.used)
          .slice(0, 300)
          .map((w) => `w:${w}` as BombAction),
        'stall',
      ];

export function applyBomb(s: BombState, a: BombAction): BombState {
  // The listed actions are a sample (up to 300 words); any valid unused word is accepted.
  const ok =
    s.status === 'playing' &&
    s.holder === 0 &&
    (a === 'stall' ||
      (a.startsWith('w:') && wordProblem(s, a.slice(2), (w) => DICT.has(w)) === null));
  if (!ok) throw new IllegalActionError(`Illegal action ${String(a)}`);
  if (a === 'stall') return botsMove(burn(s, 2));
  const w = a.slice(2);
  const burnt = burn(s, 1.5 + 0.15 * w.length);
  if (burnt.players[0]!.lives < s.players[0]!.lives) return botsMove(burnt);
  return botsMove(playWord(burnt, w));
}

function outcome(s: BombState): Outcome | null {
  if (s.status !== 'over' && s.players[0]!.lives > 0) return null;
  const won = s.winner === 0;
  return {
    returns: [won ? 1 : 0],
    winners: won ? [0] : [],
    draw: false,
    scores: [s.used.filter(() => true).length],
    reason: won ? 'last-standing' : 'exploded',
  };
}

const botSeat = (name: string) => ({ name, bot: true, skill: { think: 2, cps: 6, breadth: 0.5 } });

export const env: GameEnvironment<BombState, BombAction, BombState, { difficulty?: Difficulty }> = {
  id: 'syllable-bomb',
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  info: {
    kind: 'puzzle',
    minPlayers: 1,
    maxPlayers: 1,
    stochastic: true,
    hiddenInformation: true,
    zeroSum: false,
  },
  createInitialState: (c, seed) =>
    botsMove(
      newGame(
        [{ name: 'agent', bot: false }, botSeat('B1'), botSeat('B2')],
        c?.difficulty ?? 'mixed',
        seed,
      ),
    ),
  reset: (seed) =>
    botsMove(newGame([{ name: 'agent', bot: false }, botSeat('B1'), botSeat('B2')], 'mixed', seed)),
  getObservation: (s) => ({ ...s, fuse: -1 }),
  getLegalActions: bombActions,
  applyAction: applyBomb,
  getCurrentPlayer: (s) => (s.status === 'playing' && s.players[0]!.lives > 0 ? 0 : NO_PLAYER),
  isTerminal: (s) => s.status === 'over' || s.players[0]!.lives <= 0,
  getOutcome: outcome,
  getReward: (s) => outcome(s)?.returns[0] ?? 0,
  serializeState: (s) => JSON.stringify(s),
  deserializeState: (data) => {
    const parsed: unknown = JSON.parse(data);
    if (!isValidState(parsed)) throw new Error('Invalid Syllable Bomb state');
    return parsed;
  },
  cloneState: (s) => structuredClone(s),
  actionToString: (a) => a,
};

/** Plays the shortest valid word, preferring ones that add missing bonus letters. */
export function quickMove(s: BombState): BombAction {
  const missing = [...BONUS_LETTERS].filter((c) => !s.players[0]!.letters.includes(c));
  const words = wordsWith(COMMON, s.prompt, s.used).filter((w) => DICT.has(w));
  if (!words.length) {
    const any = wordsWith(ALL, s.prompt, s.used);
    return any.length ? `w:${any[0]!}` : 'stall';
  }
  words.sort(
    (a, b) =>
      a.length -
      b.length -
      (missing.filter((c) => a.includes(c)).length - missing.filter((c) => b.includes(c)).length) *
        0.5,
  );
  return `w:${words[0]!}`;
}

class Quick implements Agent<BombState, BombAction> {
  readonly id = 'quick-typist';
  readonly label = 'Quick typist';
  selectAction(
    _e: GameEnvironment<BombState, BombAction>,
    s: BombState,
    _p: number,
    _c: DecisionContext,
  ) {
    return quickMove(s);
  }
}

export const AGENT_PRESETS: AgentPreset<BombState, BombAction>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Any valid word, or stalls.',
      es: 'Cualquier palabra válida, o se entretiene.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'quick-typist',
    kind: 'heuristic',
    label: { en: 'Quick typist', es: 'Mecanógrafo rápido' },
    description: {
      en: 'Short common words first, chasing bonus letters.',
      es: 'Primero palabras cortas y comunes, buscando letras extra.',
    },
    create: () => new Quick(),
  },
];

export const bundle: AiBundle<BombState, BombAction> = {
  env: env as unknown as AiBundle<BombState, BombAction>['env'],
  agents: AGENT_PRESETS,
};
export default bundle;
