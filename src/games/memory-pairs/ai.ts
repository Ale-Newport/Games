/**
 * Memory Pairs players. They see what any player at the table has seen; what differs is how much
 * they remember.
 *
 * Every player follows the same plan: take a pair it remembers; otherwise turn over a card it does
 * not remember, and if that card's twin is remembered turn it next, else turn over another unknown
 * card. The forgetful player remembers only the last 6 cards turned over, the attentive one the last
 * 14, and the perfect one everything.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment } from '../../ai/protocols/types';
import { nextUint32, seedRng } from '../../core/game-engine/random';
import { legalActions, observe, type MemoryGame } from './engine';

export const MEMORY = { forgetful: 6, attentive: 14, perfect: Infinity };

/** The faces this player remembers, by position (cards still in play). */
function remembered(g: MemoryGame, span: number): Map<number, number> {
  const out = new Map<number, number>();
  const recent = span === Infinity ? g.flips : g.flips.slice(-span);
  for (const i of recent) if (!g.taken[i] && g.known[i] !== undefined) out.set(i, g.known[i]!);
  return out;
}

const pick = (g: MemoryGame, xs: number[]) => {
  const [x] = nextUint32(seedRng((g.seed ^ Math.imul(g.history.length + 3, 0x9e3779b1)) >>> 0));
  return xs[x % xs.length]!;
};

export function memoryFlip(full: MemoryGame, span: number): number {
  const g = observe(full);
  const mem = remembered(g, span);
  const live = legalActions(g).map((a) => Number(a.slice(5)));
  const unknown = live.filter((i) => !mem.has(i));
  if (g.open !== null) {
    const face = g.known[g.open]!;
    const twin = [...mem.entries()].find(([i, f]) => f === face && i !== g.open);
    if (twin) return twin[0];
    const fresh = unknown.filter((i) => i !== g.open);
    return pick(g, fresh.length ? fresh : live);
  }
  // A remembered pair?
  const byFace = new Map<number, number[]>();
  for (const [i, f] of mem) byFace.set(f, [...(byFace.get(f) ?? []), i]);
  for (const ps of byFace.values()) if (ps.length >= 2) return ps[0]!;
  return pick(g, unknown.length ? unknown : live);
}

class MemoryAgent implements Agent<MemoryGame, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly span: number,
  ) {}
  selectAction(
    _env: GameEnvironment<MemoryGame, string>,
    g: MemoryGame,
    _player: number,
    _ctx: DecisionContext,
  ): string {
    return `flip:${memoryFlip(g, this.span)}`;
  }
}

export const AGENT_PRESETS: AgentPreset<MemoryGame, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Turns over any card.', es: 'Da la vuelta a cualquier carta.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'forgetful',
    kind: 'heuristic',
    label: { en: 'Forgetful', es: 'Despistado' },
    description: {
      en: 'Remembers only the last 6 cards turned over.',
      es: 'Solo recuerda las últimas 6 cartas vistas.',
    },
    create: () => new MemoryAgent('forgetful', 'Forgetful', MEMORY.forgetful),
  },
  {
    id: 'attentive',
    kind: 'heuristic',
    label: { en: 'Attentive', es: 'Atento' },
    description: {
      en: 'Remembers the last 14 cards turned over.',
      es: 'Recuerda las últimas 14 cartas vistas.',
    },
    create: () => new MemoryAgent('attentive', 'Attentive', MEMORY.attentive),
  },
  {
    id: 'perfect',
    kind: 'heuristic',
    label: { en: 'Perfect memory', es: 'Memoria perfecta' },
    description: { en: 'Never forgets a card.', es: 'Nunca olvida una carta.' },
    create: () => new MemoryAgent('perfect', 'Perfect memory', MEMORY.perfect),
  },
];
