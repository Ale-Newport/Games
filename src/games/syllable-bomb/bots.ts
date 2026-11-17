/**
 * Syllable Bomb bots: each knows the most common words of the modern vocabulary (how many depends
 * on its breadth) and only occasionally an obscure dictionary word. On its turn it looks for a known
 * unused word containing the prompt — sharp bots prefer words that add missing bonus letters — and
 * takes time to think and to type it. With no known word it hesitates while the fuse burns.
 */
import type { Rng } from '../../core/game-engine/random';
import { BONUS_LETTERS, type BombState } from './engine';

export interface BotPlan {
  word: string | null;
  /** Seconds before the word is typed (or before it gives up looking). */
  seconds: number;
}

export function botPlan(
  s: BombState,
  common: readonly string[],
  all: readonly string[],
  rng: Rng,
): BotPlan {
  const p = s.players[s.holder]!;
  const skill = p.skill ?? { think: 2, cps: 6, breadth: 0.5 };
  const used = new Set(s.used);
  const known = common.slice(0, Math.round(4000 + 26000 * skill.breadth));
  let pool = known.filter((w) => w.length >= 3 && w.includes(s.prompt) && !used.has(w));
  if (!pool.length && rng.chance(skill.breadth * 0.5))
    pool = all.filter((w) => w.includes(s.prompt) && !used.has(w)).slice(0, 50);
  if (!pool.length) return { word: null, seconds: skill.think * 2.5 };
  const missing = [...BONUS_LETTERS].filter((c) => !p.letters.includes(c));
  const gain = (w: string) => missing.filter((c) => w.includes(c)).length;
  pool = pool.slice(0, 400);
  const word =
    skill.breadth > 0.6
      ? pool.sort((a, b) => gain(b) - gain(a))[rng.int(Math.min(3, pool.length))]!
      : rng.pick(pool);
  const hardness = Math.max(0, 1 - pool.length / 200);
  return { word, seconds: skill.think * (0.6 + hardness) + word.length / skill.cps + rng.float() };
}
