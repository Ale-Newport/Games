/**
 * Hashiwokakero agents: a random builder, the technique solver (its deductions, the exact solution
 * only if stuck), and the exact solver.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { blockedBy, countSolutions, hintStep, islandCounts, type HashiState } from './engine';

/** Add a bridge where no island would go over its number and nothing crosses. */
export function hashiActions(s: HashiState): string[] {
  if (s.solved) return [];
  const counts = islandCounts(s);
  return s.puzzle.pairs.flatMap((q, i) =>
    s.bridges[i]! < 2 &&
    counts[q.a]! < s.puzzle.islands[q.a]!.n &&
    counts[q.b]! < s.puzzle.islands[q.b]!.n &&
    !blockedBy(s, i).length
      ? [`${i}:${s.bridges[i]! + 1}`]
      : [],
  );
}

export function solverMove(s: HashiState): string {
  const truth = countSolutions(s.puzzle, 1).first ?? s.puzzle.solution;
  const q = s.bridges.findIndex((b, i) => b < truth[i]!);
  return `${q}:${s.bridges[q]! + 1}`;
}

export function logicMove(s: HashiState): string {
  const h = hintStep(s);
  return h ? `${h.pair}:${s.bridges[h.pair]! + 1}` : solverMove(s);
}

class HashiAgent implements Agent<HashiState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: HashiState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<HashiState, string>,
    s: HashiState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<HashiState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Adds any bridge that still fits.',
      es: 'Añade cualquier puente que aún quepa.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'logic',
    kind: 'heuristic',
    label: { en: 'Technique solver', es: 'Solucionador por técnicas' },
    description: {
      en: 'Solves like a person: full islands, forced bridges, crossings and isolation.',
      es: 'Resuelve como una persona: islas llenas, puentes forzados, cruces y aislamiento.',
    },
    create: () => new HashiAgent('logic', 'Technique solver', logicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Bound propagation plus search with a connectivity check: always finds the bridges.',
      es: 'Propagación de límites y búsqueda con comprobación de conexión: siempre encuentra los puentes.',
    },
    create: () => new HashiAgent('solver', 'Exact solver', solverMove),
  },
];
