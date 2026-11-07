/** Pig players: random, the hold-at-20 rule of thumb, and the optimal policy of the solved game. */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { holdAt20, optimalAction, type PigGame } from './engine';

class PigAgent implements Agent<PigGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (g: PigGame) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<PigGame, string>,
    g: PigGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(g);
  }
}

export const AGENT_PRESETS: AgentPreset<PigGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Rolls or holds at random.', es: 'Tira o se planta al azar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'hold20',
    kind: 'heuristic',
    label: { en: 'Hold at 20', es: 'Plantarse con 20' },
    description: {
      en: 'The rule of thumb: hold once the turn total reaches 20.',
      es: 'La regla práctica: plantarse cuando el total del turno llega a 20.',
    },
    create: () => new PigAgent('hold20', 'Hold at 20', holdAt20),
  },
  {
    id: 'optimal',
    kind: 'solver',
    label: { en: 'Optimal', es: 'Óptimo' },
    description: {
      en: 'The solved game: value iteration over both scores and the turn total gives the best choice.',
      es: 'El juego resuelto: la iteración de valor sobre ambos marcadores y el total del turno da la mejor elección.',
    },
    create: () => new PigAgent('optimal', 'Optimal', optimalAction),
  },
];
