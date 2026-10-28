/**
 * Code Breaker agents: a random guesser, a guesser that always plays a code consistent with every
 * score so far, and the minimax breaker (the guess whose worst answer leaves the fewest codes).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { chooseGuess, consistent, spaceFor, variantOf, type CodeBreakerState } from './engine';

export const codeString = (code: readonly number[]) => code.join('');
export const parseCode = (a: string) => [...a].map(Number);

export function codeActions(s: CodeBreakerState): string[] {
  if (s.status !== 'playing') return [];
  const space = spaceFor(variantOf(s));
  return Array.from({ length: space.count }, (_, i) => codeString(space.code(i)));
}

export function minimaxMove(s: CodeBreakerState): string {
  const space = spaceFor(variantOf(s));
  return codeString(space.code(chooseGuess(space, s.guesses).index));
}

export function consistentMove(s: CodeBreakerState, rng: Rng): string {
  const space = spaceFor(variantOf(s));
  return codeString(space.code(rng.pick(consistent(space, s.guesses))));
}

class BreakerAgent implements Agent<CodeBreakerState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: CodeBreakerState, rng: Rng) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<CodeBreakerState, string>,
    s: CodeBreakerState,
    _player: number,
    ctx: DecisionContext,
  ): string {
    return this.move(s, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<CodeBreakerState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Guesses any code.', es: 'Prueba cualquier código.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'consistent',
    kind: 'heuristic',
    label: { en: 'Consistent guesser', es: 'Adivino coherente' },
    description: {
      en: 'Always guesses a code that fits every score so far, picked at random.',
      es: 'Siempre prueba un código que encaja con todas las respuestas, elegido al azar.',
    },
    create: () => new BreakerAgent('consistent', 'Consistent guesser', consistentMove),
  },
  {
    id: 'minimax',
    kind: 'search',
    label: { en: 'Minimax breaker', es: 'Descifrador minimax' },
    description: {
      en: 'Plays the guess whose worst possible answer leaves the fewest codes (Knuth’s method): Classic in at most five guesses.',
      es: 'Prueba el código cuya peor respuesta posible deja menos códigos (el método de Knuth): Clásico en cinco intentos como mucho.',
    },
    create: () => new BreakerAgent('minimax', 'Minimax breaker', (s) => minimaxMove(s)),
  },
];
