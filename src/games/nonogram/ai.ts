/**
 * Nonogram agents: a random marker, the line solver (one decided cell at a time), and the exact
 * solver (line propagation plus search).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { FILLED, UNKNOWN, nextLineStep, solveExact, type NonoState } from './engine';

export function nonoActions(s: NonoState): string[] {
  if (s.solved) return [];
  return s.grid.flatMap((c, i) => (c === UNKNOWN ? [`${i}:f`, `${i}:x`] : []));
}

export function solverMove(s: NonoState): string {
  const cell = s.grid.indexOf(UNKNOWN);
  const truth = solveExact(s.puzzle, undefined, 1).first ?? s.puzzle.solution;
  return `${cell}:${truth[cell] ? 'f' : 'x'}`;
}

export function logicMove(s: NonoState): string {
  const set = nextLineStep(s.puzzle, s.grid)?.set[0];
  return set ? `${set.cell}:${set.value === FILLED ? 'f' : 'x'}` : solverMove(s);
}

class NonoAgent implements Agent<NonoState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: NonoState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<NonoState, string>,
    s: NonoState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<NonoState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Fills or crosses any unknown cell.',
      es: 'Rellena o tacha cualquier casilla.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'logic',
    kind: 'heuristic',
    label: { en: 'Line solver', es: 'Solucionador por líneas' },
    description: {
      en: 'Solves like a person: what every placement of a line’s runs agrees on.',
      es: 'Resuelve como una persona: lo que tienen en común todas las colocaciones de los tramos de una línea.',
    },
    create: () => new NonoAgent('logic', 'Line solver', logicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Line propagation plus search: always finds the picture.',
      es: 'Propagación por líneas y búsqueda: siempre encuentra el dibujo.',
    },
    create: () => new NonoAgent('solver', 'Exact solver', solverMove),
  },
];
