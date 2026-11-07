/**
 * Narde players: random, greedy (the play with the best evaluation right after it) and expectimax
 * (each of the best few plays judged over the opponent's 21 rolls and greedy replies).
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { expectimaxPlay, greedyPlay } from './evaluate';
import { legalActions, playKey, playsOf, type NardeMatch } from './match';

export type Strength = 'greedy' | 'expectimax';

export function chooseAction(s: NardeMatch, strength: Strength): string {
  if (s.phase !== 'move') return legalActions(s)[0]!;
  const plays = playsOf(s);
  if (!plays.length) return 'pass';
  return playKey(
    strength === 'expectimax' ? expectimaxPlay(plays, s.turn) : greedyPlay(plays, s.turn),
  );
}

class NardeAgent implements Agent<NardeMatch, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly strength: Strength,
  ) {}
  selectAction(
    _env: GameEnvironment<NardeMatch, string>,
    s: NardeMatch,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return chooseAction(s, this.strength);
  }
}

export const AGENT_PRESETS: AgentPreset<NardeMatch, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal play.', es: 'Cualquier jugada legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'greedy',
    kind: 'heuristic',
    label: { en: 'Greedy', es: 'Voraz' },
    description: {
      en: 'The play that looks best right after it: race, blocks in front of the opponent, points held, no tall stacks.',
      es: 'La jugada que mejor parece justo después: carrera, bloqueos delante del rival, puntos ocupados, sin pilas altas.',
    },
    create: () => new NardeAgent('greedy', 'Greedy', 'greedy'),
  },
  {
    id: 'expectimax',
    kind: 'search',
    label: { en: 'Expectimax', es: 'Expectimax' },
    description: {
      en: 'Weighs its best plays over all 21 replies of the dice, with the opponent answering greedily.',
      es: 'Pondera sus mejores jugadas sobre las 21 tiradas de respuesta, con el rival respondiendo de forma voraz.',
    },
    create: () => new NardeAgent('expectimax', 'Expectimax', 'expectimax'),
  },
];
