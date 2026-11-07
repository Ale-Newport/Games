/**
 * Nurikabe agents: a random marker, the technique solver (its deductions, falling back on the exact
 * solution only when stuck), and the exact solver.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { SEA, UNKNOWN, countSolutions, nextStep, ruleBreaks, type NuriState } from './engine';

/** Marks for undecided cells that break no rule at once. */
export function nuriActions(s: NuriState): string[] {
  if (s.solved) return [];
  const breaks = ruleBreaks(s);
  if (breaks.pools.size || breaks.islands.size) return [];
  return s.marks.flatMap((m, c) => (m === UNKNOWN ? [`${c}:l`, `${c}:s`] : []));
}

export function solverMove(s: NuriState): string {
  const cell = s.marks.indexOf(UNKNOWN);
  const solution = countSolutions(s.puzzle, 1).first ?? s.puzzle.solution;
  return `${cell}:${solution[cell] ? 's' : 'l'}`;
}

export function logicMove(s: NuriState): string {
  const step = nextStep(s.puzzle, s.marks);
  const set = step?.set[0];
  if (set) return `${set.cell}:${set.mark === SEA ? 's' : 'l'}`;
  return solverMove(s);
}

class NuriAgent implements Agent<NuriState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: NuriState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<NuriState, string>,
    s: NuriState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<NuriState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Shades or keeps any undecided cell.',
      es: 'Sombrea o mantiene cualquier casilla sin decidir.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'logic',
    kind: 'heuristic',
    label: { en: 'Technique solver', es: 'Solucionador por técnicas' },
    description: {
      en: 'Solves like a person: finished islands, cells between islands, unreachable cells, pools and exits.',
      es: 'Resuelve como una persona: islas completas, casillas entre islas, casillas inalcanzables, charcos y salidas.',
    },
    create: () => new NuriAgent('logic', 'Technique solver', logicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'The techniques as propagation plus search: always finds the sea.',
      es: 'Las técnicas como propagación y búsqueda: siempre encuentra el mar.',
    },
    create: () => new NuriAgent('solver', 'Exact solver', solverMove),
  },
];
