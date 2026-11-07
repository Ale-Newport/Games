/**
 * Double-six dominoes for 2–4 players, shared by the block, draw and all-fives games (catalog #156–
 * #158). The 28 tiles are dealt from a shuffle fixed by the seed and the hand number. Each hand
 * opens with the highest double held (or, without one, the heaviest tile); after the first hand the
 * previous winner leads with any tile. Tiles join the layout on an open end showing the same number.
 *
 * The layout is a centre tile with arms: arm 0 to the right, arm 1 to the left, and — when the rules
 * use a spinner and the centre is a double — arms 2 (up) and 3 (down), open once both sides of the
 * spinner hold a tile. A player who cannot play draws from the boneyard one tile at a time (draw
 * games) or passes (block games, or an empty boneyard). A hand ends when a player plays their last
 * tile ("domino") or nobody can play ("blocked"). The winner — the player who went out, or the
 * lowest pip count when blocked (a tie for lowest scores nothing) — scores the other hands' pips
 * (minus their own when blocked), rounded to the nearest 5 in all fives. In all fives a play that
 * leaves the open ends adding up to a multiple of 5 also scores that sum at once. The first to the
 * target wins; the hidden tiles are the other hands and the boneyard.
 *
 * Actions: "play:<tile>" (the first tile of a hand), "play:<tile>:<arm>", "draw", "pass", "next"
 * (deal the next hand).
 */
import { nextUint32, seedRng } from '../../../core/game-engine/random';

export interface BonesRules {
  id: string;
  /** Draw from the boneyard when unable to play (otherwise pass). */
  draw: boolean;
  /** The opening double is a spinner with four arms. */
  spinner: boolean;
  /** Score multiples of 5 during play, and round hand bonuses to 5. */
  fives: boolean;
  target: number;
  /** Tiles dealt per player, by player count (index = players). */
  dealSize: (players: number) => number;
}

export const BLOCK: BonesRules = {
  id: 'block',
  draw: false,
  spinner: false,
  fives: false,
  target: 50,
  dealSize: () => 7,
};
export const DRAW: BonesRules = {
  id: 'draw',
  draw: true,
  spinner: false,
  fives: false,
  target: 100,
  dealSize: (n) => (n === 2 ? 7 : 5),
};
export const ALL_FIVES: BonesRules = {
  id: 'all-fives',
  draw: true,
  spinner: true,
  fives: true,
  target: 150,
  dealSize: (n) => (n === 2 ? 7 : 5),
};

/** Tile t = [a, b] with a ≤ b, numbered 0–27 in order 0-0, 0-1, …, 0-6, 1-1, … 6-6. */
export const TILES: [number, number][] = [];
for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) TILES.push([a, b]);
export const pips = (t: number) => TILES[t]![0] + TILES[t]![1];
export const isDouble = (t: number) => TILES[t]![0] === TILES[t]![1];
export const tileOf = (a: number, b: number) =>
  TILES.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));

export interface Placed {
  tile: number;
  /** The number left open on the far side. */
  outer: number;
}

export interface Layout {
  centre: number;
  arms: Placed[][];
}

export interface BonesGame {
  rules: string;
  seed: number;
  players: number;
  hand: number;
  hands: number[][];
  boneyard: number[];
  layout: Layout | null;
  scores: number[];
  turn: number;
  /** Consecutive passes (all players passing blocks the hand). */
  passes: number;
  /** Numbers each player is known not to hold (they drew or passed facing them). */
  voids: number[][];
  phase: 'play' | 'handOver' | 'over';
  /** The last scoring or end-of-hand event. */
  event:
    | { kind: 'fives'; player: number; points: number }
    | {
        kind: 'domino' | 'blocked';
        winner: number | null;
        points: number;
        pips: number[];
        fives: number;
      }
    | null;
  winner: number | null;
  /** The previous hand's winner (leads the next hand), or null. */
  leader: number | null;
  history: string[];
}

const RULES: Record<string, BonesRules> = { block: BLOCK, draw: DRAW, 'all-fives': ALL_FIVES };
export const rulesOf = (g: BonesGame) => RULES[g.rules]!;

function shuffled(seed: number, hand: number): number[] {
  let rng = seedRng((seed ^ Math.imul(hand + 1, 0x9e3779b1)) >>> 0);
  const tiles = TILES.map((_, i) => i);
  for (let i = tiles.length - 1; i > 0; i--) {
    const [x, next] = nextUint32(rng);
    rng = next;
    const j = x % (i + 1);
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
  }
  return tiles;
}

function deal(
  g: Omit<BonesGame, 'hands' | 'boneyard' | 'turn'>,
  rules: BonesRules,
): Pick<BonesGame, 'hands' | 'boneyard' | 'turn'> {
  const tiles = shuffled(g.seed, g.hand);
  const k = rules.dealSize(g.players);
  const hands = Array.from({ length: g.players }, (_, p) =>
    tiles.slice(p * k, (p + 1) * k).sort((a, b) => a - b),
  );
  const boneyard = tiles.slice(g.players * k);
  let turn = g.leader ?? 0;
  if (g.leader === null) {
    // The highest double opens; without one, the heaviest tile.
    let best = -1;
    hands.forEach((h, p) =>
      h.forEach((t) => {
        const rank = (isDouble(t) ? 100 : 0) + pips(t) * 2 + TILES[t]![1] / 10;
        if (rank > best) {
          best = rank;
          turn = p;
        }
      }),
    );
  }
  return { hands, boneyard, turn };
}

export function newBones(rules: BonesRules, players: number, seed: number): BonesGame {
  const base = {
    rules: rules.id,
    seed: seed >>> 0,
    players,
    hand: 0,
    layout: null,
    scores: new Array<number>(players).fill(0),
    passes: 0,
    voids: Array.from({ length: players }, () => [] as number[]),
    phase: 'play' as const,
    event: null,
    winner: null,
    leader: null,
    history: [],
  };
  return { ...base, ...deal(base, rules) };
}

/** The tile that must open the first hand (the highest double, else the heaviest), or null. */
export function forcedOpening(g: BonesGame): number | null {
  if (g.layout || g.leader !== null) return null;
  const h = g.hands[g.turn]!;
  return h.reduce((a, b) => {
    const rank = (t: number) => (isDouble(t) ? 100 : 0) + pips(t) * 2 + TILES[t]![1] / 10;
    return rank(b) > rank(a) ? b : a;
  });
}

/** The arms open for play now. */
export function openArms(rules: BonesRules, layout: Layout): number[] {
  const spin =
    rules.spinner &&
    isDouble(layout.centre) &&
    layout.arms[0]!.length > 0 &&
    layout.arms[1]!.length > 0;
  return spin ? [0, 1, 2, 3] : [0, 1];
}

/** The number open at the end of an arm. */
export function armEnd(layout: Layout, arm: number): number {
  const placed = layout.arms[arm]!;
  if (placed.length) return placed[placed.length - 1]!.outer;
  const [a, b] = TILES[layout.centre]!;
  return arm === 1 ? a : b;
}

/** The open numbers of the layout (one per open arm). */
export const openEnds = (rules: BonesRules, layout: Layout) =>
  openArms(rules, layout).map((a) => armEnd(layout, a));

/** Every [tile, arm] a hand can play (arm −1 for the opening tile). */
export function playsFor(g: BonesGame, hand: readonly number[]): [number, number][] {
  if (!g.layout) {
    const forced = forcedOpening(g);
    return (forced !== null ? [forced] : hand).map((t) => [t, -1]);
  }
  const out: [number, number][] = [];
  const rules = rulesOf(g);
  for (const arm of openArms(rules, g.layout)) {
    const e = armEnd(g.layout, arm);
    for (const t of hand) if (TILES[t]![0] === e || TILES[t]![1] === e) out.push([t, arm]);
  }
  return out;
}

export function legalActions(g: BonesGame): string[] {
  if (g.phase === 'over') return [];
  if (g.phase === 'handOver') return ['next'];
  const plays = playsFor(g, g.hands[g.turn]!);
  if (plays.length) return plays.map(([t, a]) => (a < 0 ? `play:${t}` : `play:${t}:${a}`));
  return rulesOf(g).draw && g.boneyard.length ? ['draw'] : ['pass'];
}

/** The layout after placing tile `t` on an arm (arm −1: the opening tile). */
export function place(layout: Layout | null, t: number, arm: number): Layout {
  if (!layout || arm < 0) return { centre: t, arms: [[], [], [], []] };
  const e = armEnd(layout, arm);
  const [a, b] = TILES[t]!;
  const outer = a === e ? b : a;
  return {
    ...layout,
    arms: layout.arms.map((x, i) => (i === arm ? [...x, { tile: t, outer }] : x)),
  };
}

/** The all-fives count: open ends, with a double at an end (or a spinner open on one side) counting twice. */
export function fivesCount(rules: BonesRules, layout: Layout): number {
  const c = layout.centre;
  const [a, b] = TILES[c]!;
  const arms = layout.arms;
  if (!arms[0]!.length && !arms[1]!.length) return a + b;
  let sum = 0;
  for (const arm of openArms(rules, layout)) {
    const placed = arms[arm]!;
    if (placed.length) {
      const last = placed[placed.length - 1]!;
      sum += isDouble(last.tile) ? 2 * last.outer : last.outer;
    } else if (arm < 2) sum += isDouble(c) ? 2 * a : arm === 1 ? a : b;
  }
  return sum;
}

const handPips = (h: readonly number[]) => h.reduce((s, t) => s + pips(t), 0);
const round5 = (n: number) => 5 * Math.round(n / 5);

function endHand(g: BonesGame, out: number | null, fives = 0): BonesGame {
  const rules = rulesOf(g);
  const totals = g.hands.map(handPips);
  let winner = out;
  let points = 0;
  if (out !== null) points = totals.reduce((s, x, p) => (p === out ? s : s + x), 0);
  else {
    const low = Math.min(...totals);
    const lows = totals.flatMap((x, p) => (x === low ? [p] : []));
    winner = lows.length === 1 ? lows[0]! : null;
    if (winner !== null)
      points = totals.reduce((s, x, p) => (p === winner ? s : s + x), 0) - totals[winner]!;
  }
  if (rules.fives) points = round5(points);
  const scores = [...g.scores];
  if (winner !== null) scores[winner] = scores[winner]! + points;
  const event = {
    kind: out !== null ? ('domino' as const) : ('blocked' as const),
    winner,
    points,
    pips: totals,
    fives,
  };
  const top = Math.max(...scores);
  const done = top >= rules.target;
  return {
    ...g,
    scores,
    event,
    phase: done ? 'over' : 'handOver',
    winner: done ? scores.indexOf(top) : null,
    // The winner leads the next hand; after a tied block, the next seat round.
    leader: winner ?? ((g.leader ?? g.hand) + 1) % g.players,
  };
}

export function act(g: BonesGame, action: string): BonesGame {
  if (!legalActions(g).includes(action)) return g;
  const history = [...g.history, action];
  const rules = rulesOf(g);
  if (action === 'next') {
    const base = {
      ...g,
      hand: g.hand + 1,
      layout: null,
      passes: 0,
      voids: g.voids.map(() => []),
      phase: 'play' as const,
      event: null,
      history,
    };
    return { ...base, ...deal(base, rules) };
  }
  const p = g.turn;
  const ends = g.layout ? openEnds(rules, g.layout) : [];
  const addVoids = (v: number[]) =>
    g.voids.map((x, i) => (i === p ? [...new Set([...x, ...v])].sort((a, b) => a - b) : x));
  if (action === 'draw') {
    const [t, ...boneyard] = g.boneyard;
    const hands = g.hands.map((h, i) => (i === p ? [...h, t!].sort((a, b) => a - b) : h));
    // Facing these ends the player had nothing; earlier knowledge is spoiled by the unseen draw.
    const voids = g.voids.map((x, i) => (i === p ? [...new Set(ends)].sort((a, b) => a - b) : x));
    return { ...g, hands, boneyard, voids, passes: 0, event: null, history };
  }
  if (action === 'pass') {
    const passes = g.passes + 1;
    const next = { ...g, voids: addVoids(ends), passes, event: null, history };
    if (passes >= g.players) return endHand(next, null);
    return { ...next, turn: (p + 1) % g.players };
  }
  const [, ts, as] = action.split(':');
  const t = Number(ts);
  const hands = g.hands.map((h, i) => (i === p ? h.filter((x) => x !== t) : h));
  const layout = place(g.layout, t, as === undefined ? -1 : Number(as));
  let scores = g.scores;
  let event: BonesGame['event'] = null;
  if (rules.fives) {
    const count = fivesCount(rules, layout);
    if (count > 0 && count % 5 === 0) {
      scores = scores.map((s, i) => (i === p ? s + count : s));
      event = { kind: 'fives', player: p, points: count };
    }
  }
  const next: BonesGame = {
    ...g,
    hands,
    layout,
    scores,
    event,
    passes: 0,
    history,
    turn: (p + 1) % g.players,
  };
  if (rules.fives && Math.max(...scores) >= rules.target)
    return { ...next, phase: 'over', winner: p, turn: p };
  if (!hands[p]!.length) return endHand({ ...next, turn: p }, p, event?.points ?? 0);
  return next;
}

export function isValidBones(d: unknown, rules: BonesRules): d is BonesGame {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as BonesGame;
  if (
    s.rules !== rules.id ||
    ![2, 3, 4].includes(s.players) ||
    !Number.isInteger(s.seed) ||
    s.seed < 0
  )
    return false;
  if (!Array.isArray(s.history) || !s.history.every((a) => typeof a === 'string')) return false;
  let g = newBones(rules, s.players, s.seed);
  for (const a of s.history) {
    const next = act(g, a);
    if (next === g) return false;
    g = next;
  }
  return (
    JSON.stringify([g.hands, g.boneyard, g.layout, g.scores, g.turn, g.phase, g.hand]) ===
    JSON.stringify([s.hands, s.boneyard, s.layout, s.scores, s.turn, s.phase, s.hand])
  );
}

/** What a player may see: their own hand; the other hands and the boneyard as hidden tiles (−1). */
export function observe(g: BonesGame, seat: number): BonesGame {
  if (g.phase !== 'play') return g;
  return {
    ...g,
    hands: g.hands.map((h, i) => (i === seat ? h : h.map(() => -1))),
    boneyard: g.boneyard.map(() => -1),
  };
}
