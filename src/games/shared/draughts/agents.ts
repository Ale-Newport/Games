/** Draughts opponents: generic alpha-beta with the family evaluation and capture-first ordering. */
import { AlphaBetaAgent } from '../../../ai/agents/alpha-beta-agent';
import { EpsilonAgent, RandomAgent } from '../../../ai/agents/random-agent';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { DraughtsState, DraughtsVariant, Move } from './engine';
import { evaluateDraughts } from './environment';

export interface DraughtsLevels {
  easy: { depth: number; epsilon: number };
  medium: { depth: number };
  hard: { depth: number; timeLimitMs: number };
}

export function draughtsSearch(
  v: DraughtsVariant,
  id: string,
  label: string,
  maxDepth: number,
  timeLimitMs?: number,
) {
  return new AlphaBetaAgent<DraughtsState, Move>({
    id,
    label,
    maxDepth,
    timeLimitMs,
    evaluate: (_env, s, player) => evaluateDraughts(v, s, player),
    // Longer capture sequences first, then other moves (stable on the random root shuffle).
    orderActions: (_s, actions) => actions.slice().sort((a, b) => b.length - a.length),
  });
}

export function draughtsPresets(
  v: DraughtsVariant,
  levels: DraughtsLevels,
): AgentPreset<DraughtsState, Move>[] {
  return [
    {
      id: 'random',
      kind: 'random',
      label: { en: 'Random', es: 'Aleatorio' },
      description: {
        en: 'Plays any legal move at random (captures are still compulsory).',
        es: 'Juega cualquier jugada legal al azar (las capturas siguen siendo obligatorias).',
      },
      create: () => new RandomAgent(),
    },
    {
      id: 'easy',
      kind: 'search',
      label: { en: 'Easy', es: 'Fácil' },
      description: {
        en: `Alpha-beta ${levels.easy.depth} plies with material and advancement; random move ${Math.round(levels.easy.epsilon * 100)}% of the time.`,
        es: `Alfa-beta a ${levels.easy.depth} jugadas con material y avance; jugada al azar el ${Math.round(levels.easy.epsilon * 100)}% de las veces.`,
      },
      create: () =>
        new EpsilonAgent(
          draughtsSearch(v, 'easy-core', 'Easy core', levels.easy.depth),
          levels.easy.epsilon,
          { id: 'easy', label: 'Easy' },
        ),
    },
    {
      id: 'medium',
      kind: 'search',
      label: { en: 'Medium', es: 'Medio' },
      description: {
        en: `Alpha-beta ${levels.medium.depth} plies with a transposition table.`,
        es: `Alfa-beta a ${levels.medium.depth} jugadas con tabla de transposición.`,
      },
      create: () => draughtsSearch(v, 'medium', 'Medium', levels.medium.depth),
    },
    {
      id: 'hard',
      kind: 'search',
      label: { en: 'Hard', es: 'Difícil' },
      description: {
        en: `Iterative-deepening alpha-beta up to ${levels.hard.depth} plies within ${levels.hard.timeLimitMs} ms.`,
        es: `Alfa-beta con profundización iterativa hasta ${levels.hard.depth} jugadas en ${levels.hard.timeLimitMs} ms.`,
      },
      create: () => draughtsSearch(v, 'hard', 'Hard', levels.hard.depth, levels.hard.timeLimitMs),
    },
  ];
}
