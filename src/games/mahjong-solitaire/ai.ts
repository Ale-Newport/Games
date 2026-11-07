/**
 * Mahjong solitaire players. They use only what a player sees: the faces of tiles with nothing on
 * top of them (covered faces are hidden), and which tiles are free.
 *
 * - The random player removes any free pair.
 * - The strategist scores each free pair by what it opens up: tiles stacked beneath, the length of
 *   the row a tile closes off, and whether all copies of a face are visible (then any pairing is
 *   safe); with three free copies it keeps the one that blocks least. It reshuffles only when no
 *   pair is left.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { freePairs, layoutById, legalActions, matchGroup, type MahjongGame } from './engine';

/** Faces a player can see: tiles with nothing on top (−2 marks a hidden face). */
export function visibleFaces(g: MahjongGame): number[] {
  const def = layoutById(g.layout);
  const covered = new Set<number>();
  def.slots.forEach((s, i) => {
    if (g.faces[i]! < 0) return;
    def.slots.forEach((o, j) => {
      if (g.faces[j]! >= 0 && o.z === s.z + 1 && o.x === s.x && o.y === s.y) covered.add(i);
    });
  });
  return g.faces.map((f, i) => (f < 0 ? f : covered.has(i) ? -2 : f));
}

/** How much removing tile i opens up: the tiles beneath it and the row it closes off. */
function openingValue(g: MahjongGame, i: number): number {
  const def = layoutById(g.layout);
  const s = def.slots[i]!;
  let below = 0;
  let leftRun = 0;
  let rightRun = 0;
  def.slots.forEach((o, j) => {
    if (g.faces[j]! < 0 || j === i) return;
    if (o.x === s.x && o.y === s.y && o.z < s.z) below++;
    if (o.z === s.z && o.y === s.y) {
      if (o.x < s.x) leftRun++;
      else rightRun++;
    }
  });
  // A tile at the end of a row unlocks the rest of that row; the longer, the better.
  const row = leftRun === 0 ? rightRun : rightRun === 0 ? leftRun : 0;
  return 3 * below + row;
}

export function strategistAction(g: MahjongGame): string {
  const pairs = freePairs(g);
  if (!pairs.length) return legalActions(g)[0] ?? 'shuffle';
  const seen = visibleFaces(g);
  const value = new Map<number, number>();
  const v = (i: number) => value.get(i) ?? (value.set(i, openingValue(g, i)), value.get(i)!);
  let best = pairs[0]!;
  let score = -Infinity;
  for (const [a, b] of pairs) {
    const group = matchGroup(g.faces[a]!);
    const free = new Set(
      pairs.flatMap(([x, y]) => [x, y]).filter((t) => matchGroup(g.faces[t]!) === group),
    );
    const left = g.faces.filter((f) => f >= 0 && matchGroup(f) === group).length;
    const visible = seen.filter((f) => f >= 0 && matchGroup(f) === group).length;
    let s = v(a) + v(b);
    // All remaining copies free: clearing them is always safe.
    if (free.size === left) s += 20;
    // Three free copies with the fourth still hidden: the pair should leave the least useful one.
    else if (free.size === 3 && visible === left) s += 5;
    if (s > score) {
      score = s;
      best = [a, b];
    }
  }
  return `pair:${best[0]},${best[1]}`;
}

class MahjongAgent implements Agent<MahjongGame, string> {
  lastStats?: DecisionStats;
  readonly id = 'strategist';
  readonly label = 'Strategist';
  selectAction(
    _env: GameEnvironment<MahjongGame, string>,
    g: MahjongGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return strategistAction(g);
  }
}

export const AGENT_PRESETS: AgentPreset<MahjongGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any free pair.', es: 'Cualquier pareja libre.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'strategist',
    kind: 'heuristic',
    label: { en: 'Strategist', es: 'Estratega' },
    description: {
      en: 'Opens stacks and long rows first and clears a face when all its copies are free.',
      es: 'Abre primero pilas y filas largas y limpia una cara cuando todas sus copias están libres.',
    },
    create: () => new MahjongAgent(),
  },
];
