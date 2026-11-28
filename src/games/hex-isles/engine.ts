/**
 * Hex Isles rules (pure). An island of 19 hexes (groves, reefs, salt pans, lagoons, iron cliffs and
 * one dune field) yields wood, coral, salt, fish and iron to the huts and towns on its corners
 * whenever the two dice roll a hex's number. Players (3 or 4) build paths, huts and towns, buy sea
 * charts (captains, road works, bounty, embargo, relics) and trade with the bank, harbours and each
 * other. A seven brings the storm: hands over seven cards are halved, the storm moves, blocks a hex
 * and lets the mover take a card. Ten victory points on your own turn win. Dice, the board and the
 * chart deck come from a generator stored in the state. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';

/* ---------- resources and costs ---------- */

export const RESOURCES = ['wood', 'coral', 'salt', 'fish', 'iron'] as const;
export type Resource = (typeof RESOURCES)[number];
/** A hand or a bundle: counts per resource, in RESOURCES order. */
export type Cards = [number, number, number, number, number];
export const none = (): Cards => [0, 0, 0, 0, 0];
export const total = (c: readonly number[]) => c.reduce((a, x) => a + x, 0);
export const covers = (have: readonly number[], need: readonly number[]) =>
  need.every((n, i) => (have[i] ?? 0) >= n);
const add = (a: Cards, b: readonly number[], sign = 1): Cards =>
  a.map((x, i) => x + sign * (b[i] ?? 0)) as Cards;

export type Build = 'path' | 'hut' | 'town' | 'chart';
export const COST: Record<Build, Cards> = {
  path: [1, 1, 0, 0, 0],
  hut: [1, 1, 1, 1, 0],
  town: [0, 0, 0, 2, 3],
  chart: [0, 0, 1, 1, 1],
};
export const PIECES = { path: 15, hut: 5, town: 4 } as const;
export const BANK_EACH = 19;
export const TO_WIN = 10;
export const HAND_LIMIT = 7;
export const MAX_OFFERS = 3;
/** A safety limit for engines and AI playouts: after this many rounds the most points win. */
export const MAX_ROUNDS = 250;

export type Terrain = 'grove' | 'reef' | 'saltpan' | 'lagoon' | 'cliffs' | 'dunes';
export const YIELD: Record<Terrain, number> = {
  grove: 0,
  reef: 1,
  saltpan: 2,
  lagoon: 3,
  cliffs: 4,
  dunes: -1,
};
const TERRAINS: Terrain[] = [
  ...Array<Terrain>(4).fill('grove'),
  ...Array<Terrain>(3).fill('reef'),
  ...Array<Terrain>(4).fill('saltpan'),
  ...Array<Terrain>(4).fill('lagoon'),
  ...Array<Terrain>(3).fill('cliffs'),
  'dunes',
];
const NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
/** Ways to roll n with two dice (out of 36). */
export const pips = (n: number | null) => (n === null ? 0 : 6 - Math.abs(7 - n));

export type ChartKind = 'captain' | 'roadworks' | 'bounty' | 'embargo' | 'relic';
const DECK: ChartKind[] = [
  ...Array<ChartKind>(14).fill('captain'),
  ...Array<ChartKind>(5).fill('relic'),
  ...Array<ChartKind>(2).fill('roadworks'),
  ...Array<ChartKind>(2).fill('bounty'),
  ...Array<ChartKind>(2).fill('embargo'),
];
export const CHART_KINDS: ChartKind[] = ['captain', 'roadworks', 'bounty', 'embargo', 'relic'];

/* ---------- geometry ---------- */

export interface Hex {
  q: number;
  r: number;
  x: number;
  y: number;
  /** Corner vertices, clockwise from the top. */
  verts: number[];
  /** Neighbouring hexes. */
  near: number[];
}
export interface Vertex {
  x: number;
  y: number;
  hexes: number[];
  verts: number[];
  edges: number[];
}
export interface Edge {
  a: number;
  b: number;
  hexes: number[];
}

function buildGeometry() {
  const hexes: Hex[] = [];
  for (let r = -2; r <= 2; r++)
    for (let q = -2; q <= 2; q++)
      if (Math.abs(q + r) <= 2)
        hexes.push({ q, r, x: Math.sqrt(3) * (q + r / 2), y: 1.5 * r, verts: [], near: [] });
  const key = (x: number, y: number) => `${Math.round(x * 1000)},${Math.round(y * 1000)}`;
  const pts = new Map<string, { x: number; y: number; hexes: number[] }>();
  const corners = hexes.map((h, hi) =>
    Array.from({ length: 6 }, (_, i) => {
      const ang = (Math.PI / 180) * (60 * i - 90);
      const x = h.x + Math.cos(ang);
      const y = h.y + Math.sin(ang);
      const k = key(x, y);
      const p = pts.get(k) ?? { x, y, hexes: [] };
      if (!p.hexes.includes(hi)) p.hexes.push(hi);
      pts.set(k, p);
      return k;
    }),
  );
  const ordered = [...pts.entries()].sort(([, a], [, b]) =>
    Math.abs(a.y - b.y) > 1e-6 ? a.y - b.y : a.x - b.x,
  );
  const index = new Map(ordered.map(([k], i) => [k, i]));
  const verts: Vertex[] = ordered.map(([, p]) => ({
    x: p.x,
    y: p.y,
    hexes: [...p.hexes].sort((a, b) => a - b),
    verts: [],
    edges: [],
  }));
  hexes.forEach((h, hi) => (h.verts = corners[hi]!.map((k) => index.get(k)!)));
  const edgeKey = new Map<string, number>();
  const edges: Edge[] = [];
  const pairs: [number, number][] = [];
  hexes.forEach((h) =>
    h.verts.forEach((v, i) => {
      const w = h.verts[(i + 1) % 6]!;
      const [a, b] = v < w ? [v, w] : [w, v];
      if (!edgeKey.has(`${a}-${b}`)) {
        edgeKey.set(`${a}-${b}`, -1);
        pairs.push([a, b]);
      }
    }),
  );
  pairs.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  pairs.forEach(([a, b], i) => {
    edgeKey.set(`${a}-${b}`, i);
    const hs = verts[a]!.hexes.filter((h) => verts[b]!.hexes.includes(h));
    edges.push({ a, b, hexes: hs });
    verts[a]!.verts.push(b);
    verts[b]!.verts.push(a);
    verts[a]!.edges.push(i);
    verts[b]!.edges.push(i);
  });
  hexes.forEach((h, i) => {
    h.near = hexes
      .map((o, j) => [o, j] as const)
      .filter(([o, j]) => j !== i && Math.hypot(o.x - h.x, o.y - h.y) < 1.8)
      .map(([, j]) => j);
  });
  // Coast edges (one hex) in order around the island, starting at the top and going clockwise.
  const coast = edges
    .map((e, i) => [e, i] as const)
    .filter(([e]) => e.hexes.length === 1)
    .map(([e, i]) => {
      const mx = (verts[e.a]!.x + verts[e.b]!.x) / 2;
      const my = (verts[e.a]!.y + verts[e.b]!.y) / 2;
      return { i, ang: (Math.atan2(mx, -my) + 2 * Math.PI) % (2 * Math.PI) };
    })
    .sort((a, b) => a.ang - b.ang)
    .map((c) => c.i);
  return { hexes, verts, edges, coast };
}
export const GEO = buildGeometry();
/** Nine harbour positions spread round the coast (never two on one corner). */
export const HARBOUR_EDGES = [0, 3, 7, 10, 13, 17, 20, 23, 27].map((k) => GEO.coast[k]!);

/* ---------- state ---------- */

export type HarbourKind = Resource | 'any';
export interface Board {
  terrain: Terrain[];
  numbers: (number | null)[];
  /** Harbour kind for each of HARBOUR_EDGES. */
  harbours: HarbourKind[];
}
export interface Player {
  hand: Cards;
  /** Charts that can be played (bought before this turn). */
  charts: ChartKind[];
  /** Charts bought this turn (playable from the next turn; relics count at once). */
  fresh: ChartKind[];
  captains: number;
}
export type Phase =
  | { k: 'setup'; step: number; hut: number | null }
  | { k: 'roll' }
  | { k: 'discard'; owed: number[]; start: number[] }
  | { k: 'storm'; then: 'roll' | 'main' }
  | { k: 'steal'; then: 'roll' | 'main'; from: number[] }
  | { k: 'main' }
  | { k: 'roadworks'; left: number }
  | { k: 'offer'; from: number; to: number; give: Cards; get: Cards }
  | { k: 'over' };

export type LogEntry =
  | { k: 'roll'; p: number; dice: [number, number]; gains: Cards[] }
  | { k: 'build'; p: number; what: 'path' | 'hut' | 'town'; at: number }
  | { k: 'chart'; p: number }
  | { k: 'play'; p: number; c: ChartKind; r?: number; got?: number }
  | { k: 'storm'; p: number; h: number }
  | { k: 'steal'; p: number; from: number }
  | { k: 'discard'; p: number; n: number }
  | { k: 'bank'; p: number; give: number; n: number; get: number }
  | { k: 'offer'; p: number; to: number; give: Cards; get: Cards; ok: boolean }
  | { k: 'award'; p: number | null; what: 'trail' | 'fleet' }
  | { k: 'win'; p: number };

export interface IsleGame {
  seed: number;
  rng: RngState;
  players: number;
  board: Board;
  storm: number;
  /** Building on each vertex: owner and whether it is a town. */
  sites: ({ p: number; town: boolean } | null)[];
  /** Owner of each edge's path. */
  paths: (number | null)[];
  hands: Player[];
  bank: Cards;
  deck: ChartKind[];
  turn: number;
  round: number;
  phase: Phase;
  dice: [number, number] | null;
  played: boolean;
  offers: number;
  trail: number | null;
  fleet: number | null;
  winner: number | null;
  log: LogEntry[];
}

export type Action =
  | { t: 'hut'; v: number }
  | { t: 'path'; e: number }
  | { t: 'town'; v: number }
  | { t: 'roll' }
  | { t: 'buy' }
  | { t: 'captain' }
  | { t: 'roadworks' }
  | { t: 'bounty'; r: number; r2: number }
  | { t: 'embargo'; r: number }
  | { t: 'storm'; h: number }
  | { t: 'steal'; p: number }
  | { t: 'discard'; cards: Cards }
  | { t: 'bank'; give: number; get: number }
  | { t: 'offer'; to: number; give: Cards; get: Cards }
  | { t: 'answer'; accept: boolean }
  | { t: 'end' };

/* ---------- setup ---------- */

function makeBoard(rng: Rng): Board {
  for (;;) {
    const terrain = rng.shuffle(TERRAINS);
    const nums = rng.shuffle(NUMBERS);
    let k = 0;
    const numbers = terrain.map((t) => (t === 'dunes' ? null : nums[k++]!));
    // No two red numbers (6 and 8) side by side, and no number twice on neighbouring hexes.
    const ok = GEO.hexes.every((h, i) =>
      h.near.every((j) => {
        const a = numbers[i];
        const b = numbers[j];
        if (a === null || b === null || a === undefined || b === undefined) return true;
        if (pips(a) === 5 && pips(b) === 5) return false;
        return a !== b;
      }),
    );
    if (!ok) continue;
    const harbours = rng.shuffle<HarbourKind>(['any', 'any', 'any', 'any', ...RESOURCES]);
    return { terrain, numbers, harbours };
  }
}

export function newIsles(players: number, seed: number): IsleGame {
  if (players < 3 || players > 4) throw new RangeError('Hex Isles is for 3 or 4 players');
  const rng = new Rng(seed >>> 0);
  const board = makeBoard(rng);
  const deck = rng.shuffle(DECK);
  return {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    board,
    storm: board.terrain.indexOf('dunes'),
    sites: GEO.verts.map(() => null),
    paths: GEO.edges.map(() => null),
    hands: Array.from({ length: players }, () => ({
      hand: none(),
      charts: [],
      fresh: [],
      captains: 0,
    })),
    bank: [BANK_EACH, BANK_EACH, BANK_EACH, BANK_EACH, BANK_EACH],
    deck,
    turn: 0,
    round: 0,
    phase: { k: 'setup', step: 0, hut: null },
    dice: null,
    played: false,
    offers: 0,
    trail: null,
    fleet: null,
    winner: null,
    log: [],
  };
}

/** Who places in setup step s: 0, 1, …, n−1, then n−1, …, 0. */
export const setupSeat = (n: number, step: number) => (step < n ? step : 2 * n - 1 - step);

/* ---------- queries ---------- */

export function currentPlayer(g: IsleGame): number {
  const ph = g.phase;
  if (ph.k === 'over') return -1;
  if (ph.k === 'discard') return ph.owed.findIndex((n) => n > 0);
  if (ph.k === 'offer') return ph.to;
  if (ph.k === 'setup') return setupSeat(g.players, ph.step);
  return g.turn;
}

const pieces = (g: IsleGame, p: number) => {
  const huts = g.sites.filter((s) => s?.p === p && !s.town).length;
  const towns = g.sites.filter((s) => s?.p === p && s.town).length;
  const paths = g.paths.filter((x) => x === p).length;
  return { huts, towns, paths };
};
export const piecesLeft = (g: IsleGame, p: number) => {
  const u = pieces(g, p);
  return { path: PIECES.path - u.paths, hut: PIECES.hut - u.huts, town: PIECES.town - u.towns };
};

/** Victory points; `hidden` adds the player's relics (only they know them until the end). */
export function points(g: IsleGame, p: number, hidden = true): number {
  const u = pieces(g, p);
  const relics = hidden
    ? [...g.hands[p]!.charts, ...g.hands[p]!.fresh].filter((c) => c === 'relic').length
    : 0;
  return u.huts + 2 * u.towns + (g.trail === p ? 2 : 0) + (g.fleet === p ? 2 : 0) + relics;
}

/** Corners free under the distance rule (no building on it or next to it). */
export const siteFree = (g: IsleGame, v: number) =>
  g.sites[v] === null && GEO.verts[v]!.verts.every((w) => g.sites[w] === null);

const touchesOwnPath = (g: IsleGame, p: number, v: number) =>
  GEO.verts[v]!.edges.some((e) => g.paths[e] === p);

/** Can player p build a path on edge e (connected to their network)? */
export function pathOk(g: IsleGame, p: number, e: number): boolean {
  if (g.paths[e] !== null) return false;
  const { a, b } = GEO.edges[e]!;
  return [a, b].some((v) => {
    const s = g.sites[v];
    if (s?.p === p) return true;
    if (s && s.p !== p) return false; // an opponent's building cuts the network
    return GEO.verts[v]!.edges.some((x) => x !== e && g.paths[x] === p);
  });
}

/** Trade rate for giving resource r to the bank: 4, 3 with a general harbour, 2 with its own. */
export function rate(g: IsleGame, p: number, r: number): number {
  let best = 4;
  HARBOUR_EDGES.forEach((e, k) => {
    const { a, b } = GEO.edges[e]!;
    if (g.sites[a]?.p !== p && g.sites[b]?.p !== p) return;
    const kind = g.board.harbours[k]!;
    if (kind === 'any') best = Math.min(best, 3);
    else if (RESOURCES[r] === kind) best = 2;
  });
  return best;
}

/** Longest continuous trail of player p (paths may not pass through rivals' buildings). */
export function trailLength(g: IsleGame, p: number): number {
  const mine = g.paths.map((x, i) => (x === p ? i : -1)).filter((i) => i >= 0);
  let best = 0;
  const used = new Set<number>();
  const walk = (v: number, len: number) => {
    best = Math.max(best, len);
    const s = g.sites[v];
    if (len > 0 && s && s.p !== p) return;
    for (const e of GEO.verts[v]!.edges) {
      if (g.paths[e] !== p || used.has(e)) continue;
      used.add(e);
      const { a, b } = GEO.edges[e]!;
      walk(a === v ? b : a, len + 1);
      used.delete(e);
    }
  };
  for (const e of mine) {
    const { a, b } = GEO.edges[e]!;
    walk(a, 0);
    walk(b, 0);
  }
  return best;
}

/* ---------- legal actions ---------- */

export function legalActions(g: IsleGame): Action[] {
  const ph = g.phase;
  const p = currentPlayer(g);
  const out: Action[] = [];
  const h = p >= 0 ? g.hands[p]! : null;
  switch (ph.k) {
    case 'over':
      return [];
    case 'setup':
      if (ph.hut === null) {
        GEO.verts.forEach((_, v) => siteFree(g, v) && out.push({ t: 'hut', v }));
      } else
        GEO.verts[ph.hut]!.edges.forEach((e) => g.paths[e] === null && out.push({ t: 'path', e }));
      return out;
    case 'roll':
      out.push({ t: 'roll' });
      if (!g.played && h!.charts.includes('captain')) out.push({ t: 'captain' });
      return out;
    case 'discard':
      RESOURCES.forEach((_, r) => {
        if (h!.hand[r]! > 0) {
          const c = none();
          c[r] = 1;
          out.push({ t: 'discard', cards: c });
        }
      });
      return out;
    case 'storm':
      GEO.hexes.forEach((_, hx) => hx !== g.storm && out.push({ t: 'storm', h: hx }));
      return out;
    case 'steal':
      return ph.from.map((q) => ({ t: 'steal', p: q }));
    case 'roadworks':
      GEO.edges.forEach((_, e) => pathOk(g, p, e) && out.push({ t: 'path', e }));
      return out;
    case 'offer':
      return [
        { t: 'answer', accept: true },
        { t: 'answer', accept: false },
      ].filter((a) => !a.accept || covers(g.hands[ph.to]!.hand, ph.get)) as Action[];
    case 'main': {
      const left = piecesLeft(g, p);
      const hand = h!.hand;
      if (covers(hand, COST.path) && left.path > 0)
        GEO.edges.forEach((_, e) => pathOk(g, p, e) && out.push({ t: 'path', e }));
      if (covers(hand, COST.hut) && left.hut > 0)
        GEO.verts.forEach(
          (_, v) => siteFree(g, v) && touchesOwnPath(g, p, v) && out.push({ t: 'hut', v }),
        );
      if (covers(hand, COST.town) && left.town > 0)
        GEO.verts.forEach((_, v) => {
          const s = g.sites[v];
          if (s && s.p === p && !s.town) out.push({ t: 'town', v });
        });
      if (covers(hand, COST.chart) && g.deck.length > 0) out.push({ t: 'buy' });
      if (!g.played) {
        if (h!.charts.includes('captain')) out.push({ t: 'captain' });
        if (h!.charts.includes('roadworks') && left.path > 0) out.push({ t: 'roadworks' });
        if (h!.charts.includes('bounty'))
          for (let r = 0; r < 5; r++)
            for (let r2 = r; r2 < 5; r2++)
              if (g.bank[r]! > (r === r2 ? 1 : 0) && g.bank[r2]! > 0)
                out.push({ t: 'bounty', r, r2 });
        if (h!.charts.includes('embargo'))
          for (let r = 0; r < 5; r++) out.push({ t: 'embargo', r });
      }
      for (let r = 0; r < 5; r++)
        if (hand[r]! >= rate(g, p, r))
          for (let r2 = 0; r2 < 5; r2++)
            if (r2 !== r && g.bank[r2]! > 0) out.push({ t: 'bank', give: r, get: r2 });
      out.push({ t: 'end' });
      return out;
    }
  }
}

/** Whether an action is legal (offers are checked by rule, not listed: their bundles are free). */
export function isLegal(g: IsleGame, a: Action): boolean {
  if (a.t === 'offer') return offerOk(g, a.to, a.give, a.get);
  if (a.t === 'discard' && g.phase.k === 'discard') {
    const p = currentPlayer(g);
    const n = total(a.cards);
    return (
      n > 0 &&
      n <= g.phase.owed[p]! &&
      a.cards.every((x) => Number.isInteger(x) && x >= 0) &&
      covers(g.hands[p]!.hand, a.cards)
    );
  }
  const key = actionKey(a);
  return legalActions(g).some((b) => actionKey(b) === key);
}

/** A canonical string for an action (field order does not matter). */
export function actionKey(a: Action): string {
  const o = a as unknown as Record<string, unknown>;
  return [
    a.t,
    ...Object.keys(o)
      .filter((k) => k !== 't')
      .sort()
      .map((k) => `${k}=${JSON.stringify(o[k])}`),
  ].join('|');
}

export function offerOk(g: IsleGame, to: number, give: Cards, get: Cards): boolean {
  if (g.phase.k !== 'main' || g.offers >= MAX_OFFERS) return false;
  const p = g.turn;
  if (to === p || to < 0 || to >= g.players) return false;
  const valid = (c: Cards) => c.length === 5 && c.every((x) => Number.isInteger(x) && x >= 0);
  if (!valid(give) || !valid(get) || total(give) === 0 || total(get) === 0) return false;
  if (give.some((x, i) => x > 0 && get[i]! > 0)) return false;
  return covers(g.hands[p]!.hand, give);
}

/* ---------- transitions ---------- */

const clone = (g: IsleGame): IsleGame => structuredClone(g);
const LOG_KEEP = 40;
const log = (g: IsleGame, e: LogEntry) => {
  g.log = [...g.log, e].slice(-LOG_KEEP);
};

function award(g: IsleGame) {
  // Longest trail: at least 5; the holder keeps it on a tie; a tie among others leaves it unheld.
  const lens = g.hands.map((_, p) => trailLength(g, p));
  const max = Math.max(...lens);
  let trail = g.trail;
  if (trail !== null && lens[trail]! >= max && lens[trail]! >= 5) {
    /* kept */
  } else {
    const top = lens.map((l, p) => (l === max ? p : -1)).filter((p) => p >= 0);
    trail = max >= 5 && top.length === 1 ? top[0]! : null;
  }
  if (trail !== g.trail) log(g, { k: 'award', p: trail, what: 'trail' });
  g.trail = trail;
  // Grand fleet: at least 3 captains, strictly more than the holder.
  g.hands.forEach((h, p) => {
    if (h.captains >= 3 && (g.fleet === null || h.captains > g.hands[g.fleet]!.captains)) {
      if (g.fleet !== p) log(g, { k: 'award', p, what: 'fleet' });
      g.fleet = p;
    }
  });
}

function checkWin(g: IsleGame) {
  if (g.phase.k === 'setup' || g.phase.k === 'over') return;
  const p = g.turn;
  if (points(g, p) >= TO_WIN) {
    g.winner = p;
    g.phase = { k: 'over' };
    log(g, { k: 'win', p });
  }
}

function produce(g: IsleGame, roll: number): Cards[] {
  const want = g.hands.map(() => none());
  GEO.hexes.forEach((hx, i) => {
    if (g.board.numbers[i] !== roll || i === g.storm) return;
    const r = YIELD[g.board.terrain[i]!];
    if (r < 0) return;
    for (const v of hx.verts) {
      const s = g.sites[v];
      if (s) want[s.p]![r]! += s.town ? 2 : 1;
    }
  });
  const gains = g.hands.map(() => none());
  for (let r = 0; r < 5; r++) {
    const demand = want.reduce((a, w) => a + w[r]!, 0);
    const takers = want.filter((w) => w[r]! > 0).length;
    if (demand === 0) continue;
    if (demand <= g.bank[r]!) want.forEach((w, p) => (gains[p]![r] = w[r]!));
    else if (takers === 1) {
      // The bank runs short: a single taker gets what is left; several get nothing.
      const p = want.findIndex((w) => w[r]! > 0);
      gains[p]![r] = g.bank[r]!;
    }
  }
  gains.forEach((c, p) => {
    g.hands[p]!.hand = add(g.hands[p]!.hand, c);
    g.bank = add(g.bank, c, -1);
  });
  return gains;
}

function victims(g: IsleGame, hx: number): number[] {
  const out = new Set<number>();
  for (const v of GEO.hexes[hx]!.verts) {
    const s = g.sites[v];
    if (s && s.p !== g.turn && total(g.hands[s.p]!.hand) > 0) out.add(s.p);
  }
  return [...out].sort((a, b) => a - b);
}

function takeRandom(g: IsleGame, from: number, to: number) {
  const rng = new Rng(g.rng);
  const hand = g.hands[from]!.hand;
  const n = total(hand);
  if (n === 0) return;
  let k = rng.int(n);
  let r = 0;
  while (k >= hand[r]!) k -= hand[r++]!;
  g.rng = rng.state;
  g.hands[from]!.hand[r]! -= 1;
  g.hands[to]!.hand[r]! += 1;
}

function afterStorm(g: IsleGame, then: 'roll' | 'main') {
  const from = victims(g, g.storm);
  if (from.length === 0) g.phase = then === 'roll' ? { k: 'roll' } : { k: 'main' };
  else if (from.length === 1) {
    takeRandom(g, from[0]!, g.turn);
    log(g, { k: 'steal', p: g.turn, from: from[0]! });
    g.phase = then === 'roll' ? { k: 'roll' } : { k: 'main' };
  } else g.phase = { k: 'steal', then, from };
}

function endTurn(g: IsleGame) {
  const h = g.hands[g.turn]!;
  h.charts = [...h.charts, ...h.fresh];
  h.fresh = [];
  g.turn = (g.turn + 1) % g.players;
  if (g.turn === 0) g.round += 1;
  g.played = false;
  g.offers = 0;
  g.dice = null;
  g.phase = { k: 'roll' };
  if (g.round >= MAX_ROUNDS) {
    // Safety limit: the most points (relics included) win; ties go to the earliest seat.
    const pts = g.hands.map((_, p) => points(g, p));
    g.winner = pts.indexOf(Math.max(...pts));
    g.phase = { k: 'over' };
    log(g, { k: 'win', p: g.winner });
  }
}

const spendChart = (g: IsleGame, c: ChartKind) => {
  const h = g.hands[g.turn]!;
  h.charts.splice(h.charts.indexOf(c), 1);
  g.played = true;
};

export function act(g0: IsleGame, a: Action): IsleGame {
  if (!isLegal(g0, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g = clone(g0);
  const ph = g.phase;
  const p = currentPlayer(g);
  const h = g.hands[p]!;
  const pay = (c: Cards) => {
    h.hand = add(h.hand, c, -1);
    g.bank = add(g.bank, c);
  };
  switch (a.t) {
    case 'hut': {
      g.sites[a.v] = { p, town: false };
      log(g, { k: 'build', p, what: 'hut', at: a.v });
      if (ph.k === 'setup') {
        g.phase = { k: 'setup', step: ph.step, hut: a.v };
        if (ph.step >= g.players) {
          // The second hut yields one card from each neighbouring hex.
          for (const hx of GEO.verts[a.v]!.hexes) {
            const r = YIELD[g.board.terrain[hx]!];
            if (r >= 0 && g.bank[r]! > 0) {
              h.hand[r]! += 1;
              g.bank[r]! -= 1;
            }
          }
        }
      } else {
        pay(COST.hut);
        award(g);
      }
      break;
    }
    case 'path': {
      g.paths[a.e] = p;
      log(g, { k: 'build', p, what: 'path', at: a.e });
      if (ph.k === 'setup') {
        const step = ph.step + 1;
        if (step >= 2 * g.players) {
          g.turn = 0;
          g.phase = { k: 'roll' };
        } else g.phase = { k: 'setup', step, hut: null };
      } else if (ph.k === 'roadworks') {
        const left = ph.left - 1;
        const more =
          left > 0 && piecesLeft(g, p).path > 0 && GEO.edges.some((_, e) => pathOk(g, p, e));
        g.phase = more ? { k: 'roadworks', left } : { k: 'main' };
        award(g);
      } else {
        pay(COST.path);
        award(g);
      }
      break;
    }
    case 'town':
      g.sites[a.v] = { p, town: true };
      pay(COST.town);
      log(g, { k: 'build', p, what: 'town', at: a.v });
      break;
    case 'roll': {
      const rng = new Rng(g.rng);
      const dice: [number, number] = [rng.range(1, 6), rng.range(1, 6)];
      g.rng = rng.state;
      g.dice = dice;
      const sum = dice[0] + dice[1];
      if (sum === 7) {
        log(g, { k: 'roll', p, dice, gains: g.hands.map(() => none()) });
        const owed = g.hands.map((x) =>
          total(x.hand) > HAND_LIMIT ? Math.floor(total(x.hand) / 2) : 0,
        );
        g.phase = owed.some((n) => n > 0)
          ? { k: 'discard', owed, start: owed }
          : { k: 'storm', then: 'main' };
      } else {
        const gains = produce(g, sum);
        log(g, { k: 'roll', p, dice, gains });
        g.phase = { k: 'main' };
      }
      break;
    }
    case 'discard': {
      if (ph.k !== 'discard') break;
      pay(a.cards);
      const owed = [...ph.owed];
      owed[p] = owed[p]! - total(a.cards);
      if (owed[p] === 0) log(g, { k: 'discard', p, n: ph.start[p]! });
      g.phase = owed.some((n) => n > 0)
        ? { k: 'discard', owed, start: ph.start }
        : { k: 'storm', then: 'main' };
      break;
    }
    case 'storm': {
      if (ph.k !== 'storm') break;
      g.storm = a.h;
      log(g, { k: 'storm', p, h: a.h });
      afterStorm(g, ph.then);
      break;
    }
    case 'steal': {
      if (ph.k !== 'steal') break;
      takeRandom(g, a.p, p);
      log(g, { k: 'steal', p, from: a.p });
      g.phase = ph.then === 'roll' ? { k: 'roll' } : { k: 'main' };
      break;
    }
    case 'buy': {
      pay(COST.chart);
      const c = g.deck.shift()!;
      h.fresh.push(c);
      log(g, { k: 'chart', p });
      break;
    }
    case 'captain':
      spendChart(g, 'captain');
      h.captains += 1;
      log(g, { k: 'play', p, c: 'captain' });
      award(g);
      g.phase = { k: 'storm', then: ph.k === 'roll' ? 'roll' : 'main' };
      break;
    case 'roadworks':
      spendChart(g, 'roadworks');
      log(g, { k: 'play', p, c: 'roadworks' });
      g.phase = GEO.edges.some((_, e) => pathOk(g, p, e))
        ? { k: 'roadworks', left: 2 }
        : { k: 'main' };
      break;
    case 'bounty': {
      spendChart(g, 'bounty');
      const c = none();
      c[a.r]! += 1;
      c[a.r2]! += 1;
      h.hand = add(h.hand, c);
      g.bank = add(g.bank, c, -1);
      log(g, { k: 'play', p, c: 'bounty', r: a.r, got: a.r2 });
      break;
    }
    case 'embargo': {
      spendChart(g, 'embargo');
      let got = 0;
      g.hands.forEach((o, q) => {
        if (q === p) return;
        got += o.hand[a.r]!;
        o.hand[a.r] = 0;
      });
      h.hand[a.r]! += got;
      log(g, { k: 'play', p, c: 'embargo', r: a.r, got });
      break;
    }
    case 'bank': {
      const n = rate(g, p, a.give);
      h.hand[a.give]! -= n;
      g.bank[a.give]! += n;
      h.hand[a.get]! += 1;
      g.bank[a.get]! -= 1;
      log(g, { k: 'bank', p, give: a.give, n, get: a.get });
      break;
    }
    case 'offer':
      g.offers += 1;
      g.phase = { k: 'offer', from: p, to: a.to, give: [...a.give], get: [...a.get] };
      break;
    case 'answer': {
      if (ph.k !== 'offer') break;
      if (a.accept) {
        const A = g.hands[ph.from]!;
        const B = g.hands[ph.to]!;
        A.hand = add(add(A.hand, ph.give, -1), ph.get);
        B.hand = add(add(B.hand, ph.get, -1), ph.give);
      }
      log(g, { k: 'offer', p: ph.from, to: ph.to, give: ph.give, get: ph.get, ok: a.accept });
      g.phase = { k: 'main' };
      break;
    }
    case 'end':
      endTurn(g);
      return g;
  }
  checkWin(g);
  return g;
}

/* ---------- validation ---------- */

const isCards = (c: unknown): c is Cards =>
  Array.isArray(c) && c.length === 5 && c.every((x) => Number.isInteger(x) && x >= 0);

export function isValidIsles(v: unknown): v is IsleGame {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as IsleGame;
  if (g.players !== 3 && g.players !== 4) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  if (!g.board || !Array.isArray(g.board.terrain) || g.board.terrain.length !== 19) return false;
  if (!g.board.terrain.every((t) => t in YIELD)) return false;
  if (!Array.isArray(g.board.numbers) || g.board.numbers.length !== 19) return false;
  if (!Array.isArray(g.board.harbours) || g.board.harbours.length !== 9) return false;
  if (!Array.isArray(g.sites) || g.sites.length !== GEO.verts.length) return false;
  if (!Array.isArray(g.paths) || g.paths.length !== GEO.edges.length) return false;
  if (!Array.isArray(g.hands) || g.hands.length !== g.players) return false;
  if (
    !g.hands.every(
      (h) =>
        isCards(h.hand) &&
        Array.isArray(h.charts) &&
        Array.isArray(h.fresh) &&
        [...h.charts, ...h.fresh].every((c) => CHART_KINDS.includes(c)) &&
        Number.isInteger(h.captains),
    )
  )
    return false;
  if (!isCards(g.bank) || !Array.isArray(g.deck)) return false;
  // Every card is somewhere: hands plus bank make 19 of each resource.
  for (let r = 0; r < 5; r++)
    if (g.bank[r]! + g.hands.reduce((a, h) => a + h.hand[r]!, 0) !== BANK_EACH) return false;
  if (!Number.isInteger(g.storm) || g.storm < 0 || g.storm > 18) return false;
  if (!Number.isInteger(g.turn) || g.turn < 0 || g.turn >= g.players) return false;
  const kinds = [
    'setup',
    'roll',
    'discard',
    'storm',
    'steal',
    'main',
    'roadworks',
    'offer',
    'over',
  ];
  return typeof g.phase === 'object' && g.phase !== null && kinds.includes(g.phase.k);
}
