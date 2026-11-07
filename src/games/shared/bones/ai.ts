/**
 * Domino players. They see only what a player at the table sees (`observe`): their own hand, the
 * layout, hand sizes, the boneyard's size and the numbers each player is known to lack.
 *
 * - The heavy player sheds its heaviest playable tile (in all fives, the play that scores most).
 * - The planner tries every legal play in sampled deals of the hidden tiles that agree with what is
 *   known, finishes each hand with heavy play for everyone, and keeps the play with the best
 *   average result: its own points minus the best opponent's.
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';
import {
  TILES,
  act,
  fivesCount,
  legalActions,
  observe,
  pips,
  place,
  rulesOf,
  type BonesGame,
  type Layout,
} from './engine';

const tileOfAction = (a: string) => Number(a.split(':')[1]);

/** The heavy player's choice in a full-information state (also the planner's rollout policy). */
export function heavyAction(g: BonesGame): string {
  const legal = legalActions(g);
  if (legal.length === 1 || !legal[0]!.startsWith('play')) return legal[0]!;
  const rules = rulesOf(g);
  let best = legal[0]!;
  let score = -Infinity;
  for (const a of legal) {
    const t = tileOfAction(a);
    let v = pips(t) + (TILES[t]![0] === TILES[t]![1] ? 0.5 : 0);
    if (rules.fives) {
      // The layout alone tells what the play scores (no need to see the other hands).
      const [, , arm] = a.split(':');
      const count = fivesCount(rules, place(g.layout, t, arm === undefined ? -1 : Number(arm)));
      if (count % 5 === 0) v += 100 * count;
    }
    if (v > score) {
      score = v;
      best = a;
    }
  }
  return best;
}

function placedTiles(layout: Layout | null): number[] {
  if (!layout) return [];
  return [layout.centre, ...layout.arms.flatMap((arm) => arm.map((p) => p.tile))];
}

/** A deal of the hidden tiles consistent with the hand sizes and known voids (best effort). */
export function sampleWorld(obs: BonesGame, seat: number, rng: RngState): [BonesGame, RngState] {
  const known = new Set([...obs.hands[seat]!, ...placedTiles(obs.layout)]);
  const unseen = TILES.map((_, i) => i).filter((t) => !known.has(t));
  let r = rng;
  const shuffle = (xs: number[]) => {
    for (let i = xs.length - 1; i > 0; i--) {
      const [x, next] = nextUint32(r);
      r = next;
      const j = x % (i + 1);
      [xs[i], xs[j]] = [xs[j]!, xs[i]!];
    }
    return xs;
  };
  const others = obs.hands.map((_, p) => p).filter((p) => p !== seat);
  for (let attempt = 0; attempt < 30; attempt++) {
    const pool = shuffle([...unseen]);
    const hands = obs.hands.map((h) => [...h]);
    let ok = true;
    // The most constrained players choose first.
    const order = [...others].sort((a, b) => obs.voids[b]!.length - obs.voids[a]!.length);
    for (const p of order) {
      const need = obs.hands[p]!.length;
      const voids = attempt < 25 ? obs.voids[p]! : [];
      const fits = pool.filter(
        (t) => !voids.includes(TILES[t]![0]) && !voids.includes(TILES[t]![1]),
      );
      if (fits.length < need) {
        ok = false;
        break;
      }
      hands[p] = fits.slice(0, need).sort((a, b) => a - b);
      for (const t of hands[p]!) pool.splice(pool.indexOf(t), 1);
    }
    if (ok) return [{ ...obs, hands, boneyard: shuffle(pool) }, r];
  }
  // Unreachable in practice: ignoring voids always fits.
  return [obs, r];
}

/** Points gained in the rest of the hand by `seat`, minus the most gained by another player. */
function rollout(world: BonesGame, seat: number): number {
  const start = world.scores;
  let g = world;
  for (let i = 0; i < 200 && g.phase === 'play'; i++) g = act(g, heavyAction(g));
  const gain = g.scores.map((s, p) => s - start[p]!);
  return gain[seat]! - Math.max(...gain.filter((_, p) => p !== seat));
}

export function plannerAction(g: BonesGame, worlds = 160): string {
  const legal = legalActions(g);
  if (legal.length === 1) return legal[0]!;
  const seat = g.turn;
  const obs = observe(g, seat);
  let rng = seedRng((g.seed ^ Math.imul(g.history.length + 7, 0x85ebca6b)) >>> 0);
  const totals = new Array<number>(legal.length).fill(0);
  for (let w = 0; w < worlds; w++) {
    const [world, next] = sampleWorld(obs, seat, rng);
    rng = next;
    legal.forEach((a, i) => {
      totals[i]! += rollout(act(world, a), seat);
    });
  }
  let best = 0;
  for (let i = 1; i < legal.length; i++) if (totals[i]! > totals[best]!) best = i;
  return legal[best]!;
}
