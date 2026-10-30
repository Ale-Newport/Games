/**
 * Royal Game of Ur players: random, greedy (the move that evaluates best right away, rosettes
 * first) and an expectiminimax search three moves deep over the throws.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { legalActions, rollOf, type UrGame } from './match';
import { bestMove, greedyMove } from './search';

export type Strength = 'greedy' | 'search';

export function chooseAction(g: UrGame, strength: Strength): string {
  if (g.phase !== 'move') return legalActions(g)[0]!;
  const m =
    strength === 'search'
      ? bestMove(g.pos, g.turn, rollOf(g), 3)
      : greedyMove(g.pos, g.turn, rollOf(g));
  return m ? `move:${m.from}` : 'pass';
}

class UrAgent implements Agent<UrGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly strength: Strength,
  ) {}
  selectAction(
    _env: GameEnvironment<UrGame, string>,
    g: UrGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return chooseAction(g, this.strength);
  }
}

export const AGENT_PRESETS: AgentPreset<UrGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Moves any piece it can.', es: 'Mueve cualquier pieza que pueda.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy', es: 'Voraz' },
    description: {
      en: 'Takes rosettes and captures, and the move that leaves its pieces safest and furthest along.',
      es: 'Busca rosetas y capturas, y la jugada que deja sus piezas más seguras y avanzadas.',
    },
    create: () => new UrAgent('greedy', 'Greedy', 'greedy'),
  },
  {
    id: 'search',
    kind: 'search',
    label: { en: 'Expectiminimax', es: 'Expectiminimax' },
    description: {
      en: 'Looks three moves ahead over every throw of the dice, extra turns included.',
      es: 'Mira tres jugadas por delante sobre cada tirada de los dados, turnos extra incluidos.',
    },
    create: () => new UrAgent('search', 'Expectiminimax', 'search'),
  },
];
