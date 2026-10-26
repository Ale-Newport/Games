/**
 * Go Fish opponents. Everything they use is public: the asks (who asked whom for what and how many
 * cards changed hands), the books, the hand sizes and the pond.
 *
 * - Easy asks a random player for a random rank it holds.
 * - Medium remembers: a player who asked for a rank holds it, a player who received cards holds
 *   them, a player who said "go fish" had none; it asks whoever is known to hold one of its ranks,
 *   otherwise asks for its most numerous rank.
 * - Hard keeps the same record and also counts: the unseen copies of each rank are spread over the
 *   other hands and the pond, so it asks for the (player, rank) pair with the most cards expected,
 *   with a bonus for completing a book.
 */
import { RandomAgent } from '../../ai/agents/random-agent';
import type { Agent, DecisionContext, DecisionStats } from '../../ai/agents/types';
import type { AgentPreset } from '../../ai/protocols/bundle';
import type { GameEnvironment, PlayerId } from '../../ai/protocols/types';
import type { Rng } from '../../core/game-engine/random';
import { rankOf } from '../shared/cards/cards';
import { legalFishActions, type FishState } from './engine';

type Level = 'easy' | 'medium' | 'hard';

export interface Knowledge {
  /** Cards of each rank known to be in each hand (at least). */
  known: number[][];
  /**
   * Unseen cards each player drew since denying a rank ("go fish"), or -1 if they never denied it:
   * 0 means they certainly lack it.
   */
  since: number[][];
}

/** What everyone can work out from the public record. */
export function knowledge(s: FishState): Knowledge {
  const known = s.hands.map(() => Array<number>(14).fill(0));
  const since = s.hands.map(() => Array<number>(14).fill(-1));
  for (const ask of s.asks) {
    const a = known[ask.asker]!;
    // The asker held at least one, and now also holds whatever it was given (or fished up).
    a[ask.rank] = Math.max(a[ask.rank]!, 1) + ask.got + (ask.lucky ? 1 : 0);
    known[ask.target]![ask.rank] = 0;
    if (ask.got === 0) {
      since[ask.target]![ask.rank] = 0;
      // The asker fished an unseen card.
      since[ask.asker] = since[ask.asker]!.map((n) => (n >= 0 ? n + 1 : n));
    }
    since[ask.asker]![ask.rank] = -1;
    for (const books of s.books) for (const rank of books) for (const k of known) k[rank] = 0;
  }
  for (const k of known) for (let r = 1; r <= 13; r++) k[r] = Math.min(k[r]!, 3);
  return { known, since };
}

const myRanks = (s: FishState) => {
  const counts = Array<number>(14).fill(0);
  for (const c of s.hands[s.toAct]!) counts[rankOf(c)]!++;
  return counts;
};

export function easyAction(s: FishState, rng: Rng): string {
  const legal = legalFishActions(s);
  return legal[rng.int(legal.length)]!;
}

export function mediumAction(s: FishState): string {
  const legal = legalFishActions(s);
  if (!legal[0]!.startsWith('ask:')) return legal[0]!;
  const me = s.toAct;
  const mine = myRanks(s);
  const { known, since } = knowledge(s);
  let best = legal[0]!;
  let bestScore = -Infinity;
  for (const a of legal) {
    const [, t, r] = a.split(':').map(Number) as [number, number, number];
    let score = mine[r]! * 0.5;
    if (known[t]![r]! > 0) score += 10 + known[t]![r]!;
    if (since[t]![r] === 0) score -= 10;
    score += s.hands[t]!.length * 0.05;
    if (t === (me + 1) % s.players) score += 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

/** Chance that a hand with `free` unknown cards holds one of `unseen` copies spread over `slots`. */
export function chanceHolds(unseen: number, free: number, slots: number): number {
  if (unseen <= 0 || free <= 0 || slots <= 0) return 0;
  let miss = 1;
  for (let i = 0; i < free; i++) miss *= Math.max(0, slots - unseen - i) / (slots - i);
  return 1 - miss;
}

export function hardAction(s: FishState): string {
  const legal = legalFishActions(s);
  if (!legal[0]!.startsWith('ask:')) return legal[0]!;
  const me = s.toAct;
  const mine = myRanks(s);
  const { known, since } = knowledge(s);
  const others = s.hands.map((_, p) => p).filter((p) => p !== me);
  const knownCount = (p: number) => known[p]!.reduce((a, x) => a + x, 0);
  const free = (p: number) => Math.max(0, s.hands[p]!.length - knownCount(p));
  const slots = others.reduce((a, p) => a + free(p), 0) + s.pond.length;
  let best = legal[0]!;
  let bestScore = -Infinity;
  for (const a of legal) {
    const [, t, r] = a.split(':').map(Number) as [number, number, number];
    const knownElsewhere = others.reduce((x, p) => x + known[p]![r]!, 0);
    const unseen = Math.max(0, 4 - mine[r]! - knownElsewhere);
    const fresh = since[t]![r]! < 0 ? free(t) : Math.min(free(t), since[t]![r]!);
    // A success keeps the turn, so the chance of one matters most, weighted by the cards it
    // brings toward a book. A three is asked for again and again: whoever asks first after the
    // fourth surfaces takes the book.
    const chance = known[t]![r]! > 0 ? 1 : chanceHolds(unseen, fresh, slots);
    const score =
      chance * (10 + mine[r]! * 3) + (mine[r]! === 3 ? 8 : 0) + s.hands[t]!.length * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

export function levelAction(s: FishState, level: Level, rng: Rng): string {
  if (level === 'easy') return easyAction(s, rng);
  if (level === 'medium') return mediumAction(s);
  return hardAction(s);
}

export class FishAgent implements Agent<FishState, string> {
  lastStats?: DecisionStats;
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly level: Level,
  ) {}
  selectAction(
    _env: GameEnvironment<FishState, string>,
    s: FishState,
    _player: PlayerId,
    ctx: DecisionContext,
  ): string {
    return levelAction(s, this.level, ctx.rng);
  }
}

export const AGENT_PRESETS: AgentPreset<FishState, string>[] = [
  {
    id: 'random',
    kind: 'random',
    label: { en: 'Random', es: 'Aleatorio' },
    description: { en: 'Any legal ask.', es: 'Cualquier petición legal.' },
    create: () => new RandomAgent(),
  },
  {
    id: 'easy',
    kind: 'heuristic',
    label: { en: 'Easy', es: 'Fácil' },
    description: {
      en: 'Asks anyone for any rank it holds.',
      es: 'Pide a cualquiera cualquier número que tenga.',
    },
    create: () => new FishAgent('easy', 'Easy', 'easy'),
  },
  {
    id: 'medium',
    kind: 'heuristic',
    label: { en: 'Medium', es: 'Medio' },
    description: {
      en: 'Remembers who asked for what and who said "go fish".',
      es: 'Recuerda quién pidió qué y quién dijo «¡a pescar!».',
    },
    create: () => new FishAgent('medium', 'Medium', 'medium'),
  },
  {
    id: 'hard',
    kind: 'heuristic',
    label: { en: 'Hard', es: 'Difícil' },
    description: {
      en: 'Remembers everything and counts the unseen cards to ask where they most likely are.',
      es: 'Lo recuerda todo y cuenta las cartas que no ha visto para pedir donde es más probable.',
    },
    create: () => new FishAgent('hard', 'Hard', 'hard'),
  },
];
