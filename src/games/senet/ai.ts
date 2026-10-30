/**
 * Senet players: random, greedy (the move that evaluates best right away) and an expectiminimax
 * search two moves deep over the throws.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { legalActions, rollOf, type SenetGame } from './match';
import { bestMove, greedyMove } from './search';

export type Strength = 'greedy' | 'search';

export function chooseAction(g: SenetGame, strength: Strength): string {
  if (g.phase !== 'move') return legalActions(g)[0]!;
  const m =
    strength === 'search'
      ? bestMove(g.pos, g.turn, rollOf(g), 2)
      : greedyMove(g.pos, g.turn, rollOf(g));
  return m ? `move:${m.from}` : 'pass';
}

class SenetAgent implements Agent<SenetGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly strength: Strength,
  ) {}
  selectAction(
    _env: GameEnvironment<SenetGame, string>,
    g: SenetGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return chooseAction(g, this.strength);
  }
}

export const AGENT_PRESETS: AgentPreset<SenetGame, string>[] = [
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
      en: 'The move that leaves its pieces furthest along, paired up and out of reach.',
      es: 'La jugada que deja sus piezas más avanzadas, emparejadas y fuera de alcance.',
    },
    create: () => new SenetAgent('greedy', 'Greedy', 'greedy'),
  },
  {
    id: 'search',
    kind: 'search',
    label: { en: 'Expectiminimax', es: 'Expectiminimax' },
    description: {
      en: 'Looks two moves ahead over every throw of the sticks, extra throws included.',
      es: 'Mira dos jugadas por delante sobre cada tirada de los palos, tiradas extra incluidas.',
    },
    create: () => new SenetAgent('search', 'Expectiminimax', 'search'),
  },
];
