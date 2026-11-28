/**
 * Tile Realm rules (pure). Players (2–5) take turns drawing a tile from a shuffled bag and placing
 * it next to the tiles already down so that every touching side matches (town to town, road to
 * road, meadow to meadow). They may then stand one of their seven wardens on a feature of that
 * tile — a town, a road, a meadow or a shrine — if no warden already holds the feature it joins.
 * Completed roads (1 point a tile), towns (2 a tile, 2 a banner) and shrines (9: the shrine and
 * its eight neighbours) score at once for the player(s) with most wardens on them, and those
 * wardens come back. When the bag is empty, unfinished features score half (1 a tile, 1 a banner;
 * shrines 1 + neighbours) and every meadow pays 3 for each completed town it borders. A tile that
 * fits nowhere is set aside and another drawn. The bag order comes from a generator stored in the
 * state. See README.md.
 */
import { Rng, type RngState } from '../../core/game-engine/random';
import { PORT_FEATURE, START_TYPE, TILE_TYPES, sides, type FeatureKind } from './tiles';

export const WARDENS = 7;
export const DIRS: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export interface Placed {
  x: number;
  y: number;
  type: number;
  rot: number;
}
export interface Warden {
  /** Board index of the tile and the feature of that tile. */
  tile: number;
  feature: number;
  p: number;
}
export type LogEntry =
  | { k: 'place'; p: number; tile: number; warden: number | null }
  | {
      k: 'score';
      kind: FeatureKind;
      players: number[];
      points: number;
      tiles: number;
      final?: boolean;
    }
  | { k: 'discard'; type: number }
  | { k: 'end'; scores: number[] };

export interface Realm {
  seed: number;
  rng: RngState;
  players: number;
  board: Placed[];
  wardens: Warden[];
  bag: number[];
  current: number | null;
  scores: number[];
  turn: number;
  phase: 'place' | 'over';
  winners: number[];
  log: LogEntry[];
}

export interface Action {
  t: 'place';
  x: number;
  y: number;
  r: number;
  /** Feature of the new tile to stand a warden on, or null. */
  warden: number | null;
}

/* ---------- setup ---------- */

export function newRealm(players: number, seed: number): Realm {
  if (players < 2 || players > 5) throw new RangeError('Tile Realm is for 2–5 players');
  const rng = new Rng(seed >>> 0);
  const pool: number[] = [];
  TILE_TYPES.forEach((t, i) => {
    for (let k = 0; k < t.count - (i === START_TYPE ? 1 : 0); k++) pool.push(i);
  });
  const bag = rng.shuffle(pool);
  const g: Realm = {
    seed: seed >>> 0,
    rng: rng.state,
    players,
    board: [{ x: 0, y: 0, type: START_TYPE, rot: 0 }],
    wardens: [],
    bag,
    current: null,
    scores: Array<number>(players).fill(0),
    turn: 0,
    phase: 'place',
    winners: [],
    log: [],
  };
  draw(g);
  return g;
}

/* ---------- geometry ---------- */

export const key = (x: number, y: number) => `${x},${y}`;
export function boardIndex(g: Realm): Map<string, number> {
  return new Map(g.board.map((t, i) => [key(t.x, t.y), i]));
}
/** Feature of a placed tile at a rotated port. */
const featureAt = (t: Placed, q: number) => PORT_FEATURE[t.type]![(q - 3 * t.rot + 120) % 12]!;

/** Whether a tile of `type` rotated `r` fits at (x, y). */
export function fits(
  g: Realm,
  idx: Map<string, number>,
  x: number,
  y: number,
  type: number,
  r: number,
): boolean {
  if (idx.has(key(x, y))) return false;
  const mine = sides(type, r);
  let touching = false;
  for (let s = 0; s < 4; s++) {
    const [dx, dy] = DIRS[s]!;
    const n = idx.get(key(x + dx, y + dy));
    if (n === undefined) continue;
    touching = true;
    const t = g.board[n]!;
    if (sides(t.type, t.rot)[(s + 2) % 4] !== mine[s]) return false;
  }
  return touching;
}

/** Empty cells next to the board. */
export function frontier(g: Realm): [number, number][] {
  const idx = boardIndex(g);
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const t of g.board)
    for (const [dx, dy] of DIRS) {
      const k = key(t.x + dx, t.y + dy);
      if (!idx.has(k) && !seen.has(k)) {
        seen.add(k);
        out.push([t.x + dx, t.y + dy]);
      }
    }
  return out.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

export function placements(g: Realm, type: number): [number, number, number][] {
  const idx = boardIndex(g);
  const out: [number, number, number][] = [];
  for (const [x, y] of frontier(g))
    for (let r = 0; r < 4; r++) if (fits(g, idx, x, y, type, r)) out.push([x, y, r]);
  return out;
}

/* ---------- features ---------- */

export interface Feature {
  kind: FeatureKind;
  /** Nodes "tile:feature". */
  nodes: [number, number][];
  tiles: Set<number>;
  banners: number;
  /** Sides of its tiles still open to the void (towns and roads). */
  open: number;
  /** Wardens on it per player. */
  wardens: number[];
  /** For meadows: the roots of the towns it borders. */
  towns: Set<number>;
  complete: boolean;
}
export interface Analysis {
  /** Root id of each node (tile index × 16 + feature). */
  root: Map<number, number>;
  features: Map<number, Feature>;
}
const NODE = (tile: number, f: number) => tile * 16 + f;

export function analyze(g: Realm): Analysis {
  const parent = new Map<number, number>();
  const find = (a: number): number => {
    let r = a;
    while (parent.get(r) !== r) r = parent.get(r)!;
    let c = a;
    while (parent.get(c) !== r) {
      const n = parent.get(c)!;
      parent.set(c, r);
      c = n;
    }
    return r;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb));
  };
  g.board.forEach((t, i) =>
    TILE_TYPES[t.type]!.features.forEach((_, f) => parent.set(NODE(i, f), NODE(i, f))),
  );
  const idx = boardIndex(g);
  const openSides = new Map<number, number>();
  g.board.forEach((t, i) => {
    for (let s = 0; s < 4; s++) {
      const [dx, dy] = DIRS[s]!;
      const n = idx.get(key(t.x + dx, t.y + dy));
      if (n === undefined) {
        // An open side counts against the town or road on its middle port.
        const f = featureAt(t, 3 * s + 1);
        const kind = TILE_TYPES[t.type]!.features[f]!.kind;
        if (kind === 'town' || kind === 'road')
          openSides.set(NODE(i, f), (openSides.get(NODE(i, f)) ?? 0) + 1);
        continue;
      }
      if (n < i) continue;
      const o = g.board[n]!;
      const os = (s + 2) % 4;
      for (let k = 0; k < 3; k++)
        union(NODE(i, featureAt(t, 3 * s + k)), NODE(n, featureAt(o, 3 * os + (2 - k))));
    }
  });
  const root = new Map<number, number>();
  const features = new Map<number, Feature>();
  g.board.forEach((t, i) =>
    TILE_TYPES[t.type]!.features.forEach((fd, f) => {
      const r = find(NODE(i, f));
      root.set(NODE(i, f), r);
      let F = features.get(r);
      if (!F) {
        F = {
          kind: fd.kind,
          nodes: [],
          tiles: new Set(),
          banners: 0,
          open: 0,
          wardens: Array<number>(g.players).fill(0),
          towns: new Set(),
          complete: false,
        };
        features.set(r, F);
      }
      F.nodes.push([i, f]);
      F.tiles.add(i);
      if (fd.banner) F.banners += 1;
      F.open += openSides.get(NODE(i, f)) ?? 0;
    }),
  );
  g.board.forEach((t, i) =>
    TILE_TYPES[t.type]!.features.forEach((fd, f) => {
      if (fd.kind === 'meadow' && fd.touches)
        for (const c of fd.touches)
          features.get(root.get(NODE(i, f))!)!.towns.add(root.get(NODE(i, c))!);
    }),
  );
  for (const w of g.wardens) features.get(root.get(NODE(w.tile, w.feature))!)!.wardens[w.p]! += 1;
  for (const F of features.values()) {
    if (F.kind === 'town' || F.kind === 'road') F.complete = F.open === 0;
    else if (F.kind === 'shrine') F.complete = shrineNeighbours(g, idx, F.nodes[0]![0]) === 8;
  }
  return { root, features };
}

export function shrineNeighbours(g: Realm, idx: Map<string, number>, tile: number): number {
  const t = g.board[tile]!;
  let n = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) if ((dx || dy) && idx.has(key(t.x + dx, t.y + dy))) n++;
  return n;
}

/** Points a feature is worth now (final: unfinished features at half rate; meadows). */
export function worth(g: Realm, a: Analysis, F: Feature): number {
  switch (F.kind) {
    case 'road':
      return F.tiles.size;
    case 'town':
      // Completed towns pay double; at the end, unfinished ones pay one a tile and a banner.
      return F.complete ? 2 * (F.tiles.size + F.banners) : F.tiles.size + F.banners;
    case 'shrine':
      return 1 + shrineNeighbours(g, boardIndex(g), F.nodes[0]![0]);
    case 'meadow':
      return 3 * [...F.towns].filter((r) => a.features.get(r)?.complete).length;
  }
}

/** Players with most wardens on a feature (none when nobody stands on it). */
export function holders(F: Feature): number[] {
  const max = Math.max(...F.wardens);
  return max > 0 ? F.wardens.map((w, p) => (w === max ? p : -1)).filter((p) => p >= 0) : [];
}

/* ---------- legal actions ---------- */

/** Features of the new tile a warden may stand on at a given placement. */
export function wardenSpots(g: Realm, x: number, y: number, type: number, r: number): number[] {
  if (supply(g, g.turn) === 0) return [];
  const t: Placed = { x, y, type, rot: r };
  const next: Realm = { ...g, board: [...g.board, t] };
  const a = analyze(next);
  const tile = next.board.length - 1;
  return TILE_TYPES[type]!.features.map((_, f) => f).filter((f) => {
    const F = a.features.get(a.root.get(NODE(tile, f))!)!;
    return F.wardens.every((w) => w === 0);
  });
}

export const supply = (g: Realm, p: number) => WARDENS - g.wardens.filter((w) => w.p === p).length;

export function legalActions(g: Realm): Action[] {
  if (g.phase !== 'place' || g.current === null) return [];
  const out: Action[] = [];
  for (const [x, y, r] of placements(g, g.current)) {
    out.push({ t: 'place', x, y, r, warden: null });
    for (const f of wardenSpots(g, x, y, g.current, r))
      out.push({ t: 'place', x, y, r, warden: f });
  }
  return out;
}

export function isLegal(g: Realm, a: Action): boolean {
  if (g.phase !== 'place' || g.current === null || a.t !== 'place') return false;
  if (![a.x, a.y, a.r].every(Number.isInteger) || a.r < 0 || a.r > 3) return false;
  if (!fits(g, boardIndex(g), a.x, a.y, g.current, a.r)) return false;
  return a.warden === null || wardenSpots(g, a.x, a.y, g.current, a.r).includes(a.warden);
}

/* ---------- transitions ---------- */

const LOG_KEEP = 60;
const log = (g: Realm, e: LogEntry) => {
  g.log = [...g.log, e].slice(-LOG_KEEP);
};

/** Draws the next tile that fits somewhere, setting aside those that fit nowhere. */
function draw(g: Realm) {
  g.current = null;
  while (g.bag.length) {
    const t = g.bag.shift()!;
    if (placements(g, t).length) {
      g.current = t;
      return;
    }
    log(g, { k: 'discard', type: t });
  }
  finalScoring(g);
}

function award(g: Realm, F: Feature, points: number, final: boolean) {
  const who = holders(F);
  for (const p of who) g.scores[p]! += points;
  if (who.length)
    log(g, { k: 'score', kind: F.kind, players: who, points, tiles: F.tiles.size, final });
}

function finalScoring(g: Realm) {
  const a = analyze(g);
  for (const F of a.features.values()) {
    if (F.wardens.every((w) => w === 0)) continue;
    award(g, F, worth(g, a, F), true);
  }
  g.wardens = [];
  const best = Math.max(...g.scores);
  g.winners = g.scores.map((s, p) => (s === best ? p : -1)).filter((p) => p >= 0);
  g.phase = 'over';
  log(g, { k: 'end', scores: [...g.scores] });
}

export function act(g0: Realm, a: Action): Realm {
  if (!isLegal(g0, a)) throw new Error(`Illegal action ${JSON.stringify(a)}`);
  const g: Realm = structuredClone(g0);
  const p = g.turn;
  g.board.push({ x: a.x, y: a.y, type: g.current!, rot: a.r });
  const tile = g.board.length - 1;
  if (a.warden !== null) g.wardens.push({ tile, feature: a.warden, p });
  log(g, { k: 'place', p, tile, warden: a.warden });
  // Score what this tile completed: its towns and roads, and shrines around it.
  const an = analyze(g);
  const idx = boardIndex(g);
  const roots = new Set<number>();
  TILE_TYPES[g.current!]!.features.forEach((fd, f) => {
    if (fd.kind === 'town' || fd.kind === 'road') roots.add(an.root.get(NODE(tile, f))!);
  });
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      const n = idx.get(key(a.x + dx, a.y + dy));
      if (n === undefined) continue;
      TILE_TYPES[g.board[n]!.type]!.features.forEach((fd, f) => {
        if (fd.kind === 'shrine') roots.add(an.root.get(NODE(n, f))!);
      });
    }
  for (const r of roots) {
    const F = an.features.get(r)!;
    if (!F.complete) continue;
    award(g, F, worth(g, an, F), false);
    // Its wardens go home.
    g.wardens = g.wardens.filter((w) => an.root.get(NODE(w.tile, w.feature)) !== r);
  }
  g.turn = (g.turn + 1) % g.players;
  draw(g);
  return g;
}

/* ---------- validation ---------- */

export function isValidRealm(v: unknown): v is Realm {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as Realm;
  if (!Number.isInteger(g.players) || g.players < 2 || g.players > 5) return false;
  if (!Array.isArray(g.rng) || g.rng.length !== 4) return false;
  if (!Array.isArray(g.board) || !g.board.length) return false;
  if (
    !g.board.every(
      (t) =>
        [t.x, t.y, t.type, t.rot].every(Number.isInteger) &&
        TILE_TYPES[t.type] &&
        t.rot >= 0 &&
        t.rot < 4,
    )
  )
    return false;
  if (new Set(g.board.map((t) => key(t.x, t.y))).size !== g.board.length) return false;
  if (
    !Array.isArray(g.wardens) ||
    !g.wardens.every(
      (w) =>
        g.board[w.tile] &&
        TILE_TYPES[g.board[w.tile]!.type]!.features[w.feature] &&
        w.p >= 0 &&
        w.p < g.players,
    )
  )
    return false;
  for (let p = 0; p < g.players; p++)
    if (g.wardens.filter((w) => w.p === p).length > WARDENS) return false;
  if (!Array.isArray(g.bag) || !Array.isArray(g.scores) || g.scores.length !== g.players)
    return false;
  return (g.phase === 'place' && g.current !== null) || g.phase === 'over';
}
