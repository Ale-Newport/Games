/**
 * Queens agents: a random marker, the technique solver (its deductions; the exact solution when
 * stuck), and the exact solver.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { CROSS, EMPTY, QUEEN, candidatesFrom, nextStep, type QueensState } from './engine';

/** A cross on any empty cell, or a queen where it clashes with no queen. */
export function queensActions(s: QueensState): string[] {
  if (s.solved) return [];
  const cand = candidatesFrom(s.puzzle, s.marks);
  if (!cand) return [];
  const out: string[] = [];
  s.marks.forEach((m, c) => {
    if (m !== EMPTY) return;
    out.push(`${c}:x`);
    if (cand[c]) out.push(`${c}:q`);
  });
  return out;
}

export function solverMove(s: QueensState): string {
  const p = s.puzzle;
  const r = p.solution.findIndex((k, row) => s.marks[row * p.size + k] !== QUEEN);
  if (r >= 0) return `${r * p.size + p.solution[r]!}:q`;
  const c = s.marks.findIndex((m) => m === EMPTY);
  return `${c}:x`;
}

export function logicMove(s: QueensState): string {
  const step = nextStep(s.puzzle, s.marks);
  if (step?.place.length) return `${step.place[0]}:q`;
  const cross = step?.rule.find((c) => s.marks[c] === EMPTY);
  if (cross !== undefined) return `${cross}:x`;
  return solverMove(s);
}

export const markOf = (a: string) => (a.endsWith(':q') ? QUEEN : CROSS);

class QueensAgent implements Agent<QueensState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly move: (s: QueensState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<QueensState, string>,
    s: QueensState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.move(s);
  }
}

export const AGENT_PRESETS: AgentPreset<QueensState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: {
      en: 'Crosses any empty cell or places a queen where it clashes with none.',
      es: 'Tacha cualquier casilla vacía o pone una reina donde no choca con ninguna.',
    },
    create: () => new RandomAgent(),
  },
  {
    id: 'logic',
    kind: 'heuristic',
    label: { en: 'Technique solver', es: 'Solucionador por técnicas' },
    description: {
      en: 'Solves like a person: last free cell, regions confined to a line, groups of regions, and cells whose queen would empty a row, column or region.',
      es: 'Resuelve como una persona: última casilla libre, regiones encerradas en una línea, grupos de regiones y casillas cuya reina vaciaría una fila, columna o región.',
    },
    create: () => new QueensAgent('logic', 'Technique solver', logicMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Backtracking by rows: places the unique solution.',
      es: 'Búsqueda por filas: coloca la solución única.',
    },
    create: () => new QueensAgent('solver', 'Exact solver', solverMove),
  },
];
