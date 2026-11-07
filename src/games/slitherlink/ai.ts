/**
 * Slitherlink agents: a random marker, the technique solver (its deductions, falling back on the exact
 * solution only when stuck), and the exact solver.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import {
  LINE,
  UNKNOWN,
  countSolutions,
  geometry,
  nextStep,
  ruleBreaks,
  type SlitherState,
} from './engine';

/** Draw or cross any undecided edge while no number or vertex is broken. */
export function slitherActions(s: SlitherState): string[] {
  if (s.solved) return [];
  const breaks = ruleBreaks(s);
  if (breaks.cells.size || breaks.vertices.size) return [];
  return s.edges.flatMap((v, e) => (v === UNKNOWN ? [`${e}:l`, `${e}:x`] : []));
}

export function solverMove(s: SlitherState): string {
  const edge = s.edges.indexOf(UNKNOWN);
  const geo = geometry(s.puzzle.rows, s.puzzle.cols);
  const truth = countSolutions(geo, s.puzzle.clues, 1).first ?? s.puzzle.solution;
  return `${edge}:${truth[edge] ? 'l' : 'x'}`;
}

export function logicMove(s: SlitherState): string {
  const geo = geometry(s.puzzle.rows, s.puzzle.cols);
  const set = nextStep(geo, s.puzzle.clues, s.edges)?.set[0];
  return set ? `${set.edge}:${set.value === LINE ? 'l' : 'x'}` : solverMove(s);
}

class SlitherAgent implements Agent<SlitherState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: SlitherState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<SlitherState, string>,
    s: SlitherState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<SlitherState, string>[] = [
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
      en: 'Solves like a person: numbers met or full, corners and crossings of the line, no early loops.',
      es: 'Resuelve como una persona: números cumplidos o llenos, cruces de la línea y nada de lazos prematuros.',
    },
    create: () => new SlitherAgent('logic', 'Technique solver', logicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Propagation and search over the edges: always finds the loop.',
      es: 'Propagación y búsqueda sobre los bordes: siempre encuentra el lazo.',
    },
    create: () => new SlitherAgent('solver', 'Exact solver', solverMove),
  },
];
