/**
 * Bulls and Cows agents: a random guesser, a guesser that keeps only its last three scores in mind
 * (the duel's easy opponent), one consistent with every score, and the minimax breaker.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { chooseGuess, consistent, spaceFor, variantOf, type BullsState } from './engine';

export const codeString = (code: readonly number[]) => code.join('');
export const parseCode = (a: string) => [...a].map(Number);

export function bullsActions(s: BullsState): string[] {
  if (s.status !== 'playing') return [];
  const space = spaceFor(variantOf(s));
  return Array.from({ length: space.count }, (_, i) => codeString(space.code(i)));
}

const mine = (s: BullsState) => s.guesses[s.turn]!;

export function minimaxMove(s: BullsState): string {
  const space = spaceFor(variantOf(s));
  return codeString(
    space.code(chooseGuess(space, mine(s), undefined, undefined, 'expected').index),
  );
}

export function consistentMove(s: BullsState, rng: Rng): string {
  const space = spaceFor(variantOf(s));
  return codeString(space.code(rng.pick(consistent(space, mine(s)))));
}

/** Consistent with the last three scores only: it forgets older clues. */
export function forgetfulMove(s: BullsState, rng: Rng): string {
  const space = spaceFor(variantOf(s));
  const g = mine(s);
  const fit = consistent(space, g.slice(-3));
  const fresh = fit.filter((i) => !g.some((x) => codeString(x.code) === codeString(space.code(i))));
  return codeString(space.code(rng.pick(fresh.length ? fresh : fit)));
}

export const MOVES = {
  easy: forgetfulMove,
  medium: consistentMove,
  hard: (s: BullsState) => minimaxMove(s),
} satisfies Record<string, (s: BullsState, rng: Rng) => string>;

class BullsAgent implements Agent<BullsState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: BullsState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<BullsState, string>,
    s: BullsState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.move(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<BullsState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any number.', es: 'Prueba cualquier número.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'forgetful',
    kind: 'heuristic',
    label: { en: 'Forgetful (easy)', es: 'Olvidadizo (fácil)' },
    description: {
      en: 'Guesses a number that fits its last three scores, forgetting older ones.',
      es: 'Prueba un número que encaja con sus tres últimas respuestas y olvida las anteriores.',
    },
    create: () => new BullsAgent('forgetful', 'Forgetful', forgetfulMove),
  },
  {
    id: 'consistent',
    kind: 'heuristic',
    label: { en: 'Consistent (medium)', es: 'Coherente (medio)' },
    description: {
      en: 'Guesses a random number that fits every score so far.',
      es: 'Prueba un número al azar que encaja con todas las respuestas.',
    },
    create: () => new BullsAgent('consistent', 'Consistent', consistentMove),
  },
  {
    id: 'minimax',
    kind: 'search',
    label: { en: 'Minimax (hard)', es: 'Minimax (difícil)' },
    description: {
      en: 'Plays the guess whose worst possible answer leaves the fewest numbers.',
      es: 'Prueba el número cuya peor respuesta posible deja menos números.',
    },
    create: () => new BullsAgent('minimax', 'Minimax', (s) => minimaxMove(s)),
  },
];
