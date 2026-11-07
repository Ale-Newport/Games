/**
 * Lights Out agents: a random press, light chasing (press below every lit light, row by row — the
 * classic hand method, then the solver for what reaches the bottom row), and the exact solver.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { solveLights, specOf, type LightsState } from './engine';

export const MOVE_LIMIT = 120;

export const lightsActions = (s: LightsState) => {
  const n = specOf(s).size ** 2;
  return s.solved || s.presses.length >= MOVE_LIMIT
    ? []
    : Array.from({ length: n }, (_, c) => `p:${c}`);
};

export function solverMove(s: LightsState): string {
  const spec = specOf(s);
  const plan = solveLights(s.lights, spec.size, spec.pattern) ?? [0];
  return `p:${plan[0] ?? 0}`;
}

/** Light chasing: press under the first lit light above the last row; then finish exactly. */
export function chaseMove(s: LightsState): string {
  const { size, pattern } = specOf(s);
  if (pattern === 'plus')
    for (let c = 0; c < size * (size - 1); c++) if (s.lights[c]) return `p:${c + size}`;
  return solverMove(s);
}

class LightsAgent implements Agent<LightsState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (s: LightsState) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<LightsState, string>,
    s: LightsState,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(s);
  }
}

export const AGENT_PRESETS: AgentPreset<LightsState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Presses any light.', es: 'Pulsa cualquier luz.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'chase',
    kind: 'heuristic',
    label: { en: 'Light chaser', es: 'Persecución de luces' },
    description: {
      en: 'Presses below every lit light row by row, pushing them to the bottom, then finishes from there.',
      es: 'Pulsa bajo cada luz encendida fila a fila, llevándolas abajo, y termina desde ahí.',
    },
    create: () => new LightsAgent('chase', 'Light chaser', chaseMove),
  },
  {
    id: 'solver',
    kind: 'solver',
    label: { en: 'Exact solver', es: 'Solucionador exacto' },
    description: {
      en: 'Linear algebra over two values: the fewest presses that switch everything off.',
      es: 'Álgebra lineal con dos valores: el mínimo de pulsaciones que lo apaga todo.',
    },
    create: () => new LightsAgent('solver', 'Exact solver', solverMove),
  },
];
