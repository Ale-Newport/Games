/**
 * Tile Rummy players. They see their own rack, the table and the rack sizes (`observe`).
 *
 * - The random player picks any offered play, or draws.
 * - The basic player only lays down sets made from its own rack; it never touches the table.
 * - The planner plays the generator's fullest play: new sets from its rack, tiles added to table
 *   sets (ends, groups, splits of long runs) and table tiles borrowed for new sets.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { decodePlay, legalActions, observe, type RummyGame } from './engine';

const placed = (g: RummyGame, a: string) =>
  (decodePlay(a)?.flat().length ?? 0) - g.table.flat().length;

export function plannerAction(full: RummyGame): string {
  const g = observe(full, full.turn);
  const legal = legalActions(g);
  return legal.reduce(
    (best, a) => (placed(g, a) > placed(g, best) ? a : best),
    legal[legal.length - 1]!,
  );
}

export function basicAction(full: RummyGame): string {
  const g = observe(full, full.turn);
  const legal = legalActions(g);
  const before = new Set(g.table.flat());
  // Plays that leave every table set as it was (the rack's own sets).
  const own = legal.filter(
    (a) =>
      a.startsWith('play:') &&
      decodePlay(a)!.every((s) => s.every((t) => before.has(t)) || s.every((t) => !before.has(t))),
  );
  const kept = own.filter((a) =>
    g.table.every((s) => decodePlay(a)!.some((x) => x.join(',') === s.join(','))),
  );
  return kept[0] ?? legal[legal.length - 1]!;
}

class RummyAgent implements Agent<RummyGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly pick: (g: RummyGame) => string,
  ) {}
  selectAction(
    _env: GameEnvironment<RummyGame, string>,
    g: RummyGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return this.pick(g);
  }
}

export const AGENT_PRESETS: AgentPreset<RummyGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any offered play, or a draw.', es: 'Cualquier jugada ofrecida, o robar.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'basic',
    kind: 'heuristic',
    label: { en: 'Basic', es: 'Básico' },
    description: {
      en: 'Lays down sets from its own rack and never touches the table.',
      es: 'Baja juegos de su propio atril y nunca toca la mesa.',
    },
    create: () => new RummyAgent('basic', 'Basic', basicAction),
  },
  {
    id: 'planner',
    kind: 'heuristic',
    label: { en: 'Planner', es: 'Planificador' },
    description: {
      en: 'Plays as much as it can: new sets, tiles added to the table, table tiles borrowed for new sets.',
      es: 'Juega todo lo que puede: juegos nuevos, fichas añadidas a la mesa y fichas de la mesa prestadas para juegos nuevos.',
    },
    create: () => new RummyAgent('planner', 'Planner', plannerAction),
  },
];
