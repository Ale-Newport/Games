/**
 * Hitori agents: a random marker, the technique solver (its deductions, falling back on the exact
 * solution only when stuck), and the exact solver.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { BLACK, countSolutions, nextStep, ruleBreaks, type HitoriState } from './engine';

/** Marks for undecided cells that break no rule at once. */
export function hitoriActions(s: HitoriState): string[] {
  if (s.solved) return [];
  const breaks = ruleBreaks(s);
  if (breaks.repeats.size || breaks.touching.size || breaks.split) return [];
  const out: string[] = [];
  s.marks.forEach((m, c) => {
    if (m) return;
    out.push(`${c}:w`, `${c}:b`);
  });
  return out;
}

export function solverMove(s: HitoriState): string {
  const cell = s.marks.findIndex((m) => !m);
  const solution = countSolutions(s.puzzle, 1).first ?? s.puzzle.solution;
  return `${cell}:${solution[cell] ? 'b' : 'w'}`;
}

export function logicMove(s: HitoriState): string {
  const step = nextStep(s.puzzle, s.marks);
  const set = step?.set[0];
  if (set) return `${set.cell}:${set.mark === BLACK ? 'b' : 'w'}`;
  return solverMove(s);
}

class HitoriAgent implements Agent<HitoriState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: HitoriState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<HitoriState, string>,
    s: HitoriState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<HitoriState, string>[] = [
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
      en: 'Solves like a person: unique numbers, neighbours of shaded cells, sandwiches, pairs and connectivity.',
      es: 'Resuelve como una persona: números únicos, vecinas de sombreadas, sándwiches, parejas y conexión.',
    },
    create: () => new HitoriAgent('logic', 'Technique solver', logicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Propagation and search over shaded and kept cells: always finds the solution.',
      es: 'Propagación y búsqueda sobre casillas sombreadas y mantenidas: siempre encuentra la solución.',
    },
    create: () => new HitoriAgent('solver', 'Exact solver', solverMove),
  },
];
