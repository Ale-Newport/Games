/**
 * Snakes and Ladders players. The classic game has no decisions. In the Choice variant the
 * planner moves by the die that leaves the fewest expected turns to 100 (from an exact value
 * iteration over the board), the naive player always takes the larger die, and random either.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { expectedTurns, land } from './engine';
import { legalActions, type SnakesGame } from './match';

let table: number[] | null = null;
/** Expected turns to 100 from each square under the best use of two dice (computed once). */
export const turnsLeft = () => (table ??= expectedTurns().choice);

export function plannedAction(g: SnakesGame): string {
  if (g.phase !== 'choose') return legalActions(g)[0]!;
  const e = turnsLeft();
  const from = g.pos[g.turn]!;
  const [a, b] = g.dice as [number, number];
  return e[land(from, a)]! <= e[land(from, b)]! ? 'use:0' : 'use:1';
}

export function naiveAction(g: SnakesGame): string {
  if (g.phase !== 'choose') return legalActions(g)[0]!;
  const [a, b] = g.dice as [number, number];
  return a >= b ? 'use:0' : 'use:1';
}

class SnakesAgent implements Agent<SnakesGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (g: SnakesGame) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<SnakesGame, string>,
    g: SnakesGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(g);
  }
}

export const AGENT_PRESETS: AgentPreset<SnakesGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Uses either die.', es: 'Usa cualquiera de los dos dados.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'naive',
    kind: 'heuristic',
    label: { en: 'Big step', es: 'Paso largo' },
    description: { en: 'Always moves by the larger die.', es: 'Siempre mueve con el dado mayor.' },
    create: () => new SnakesAgent('naive', 'Big step', naiveAction),
  },
  {
    id: 'planner',
    kind: 'solver',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Moves by the die that leaves the fewest expected turns to 100, from an exact value iteration over the board.',
      es: 'Mueve con el dado que deja menos turnos esperados hasta el 100, según una iteración de valor exacta sobre el tablero.',
    },
    create: () => new SnakesAgent('planner', 'Planner', plannedAction),
  },
];
