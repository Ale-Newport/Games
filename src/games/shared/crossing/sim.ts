/**
 * Crossing, shared by #178 (five burrows across a road and a river) and #179 (an endless run of
 * generated lanes), at 60 steps a second. The board is 13 columns wide; positions across are in
 * eighths of a column. Lanes are rows: roads with cars and lorries, rivers with logs and turtles
 * (some of which dive), and — in the endless game — grass with trees in the way and railway lines
 * whose rare, fast trains are announced by a signal. Every vehicle, log and turtle moves at a steady
 * speed along its lane and wraps round off-screen, so its place is a function of the step count.
 * The hedgehog hops one cell at a time (a hop takes 6 steps); it rides whatever it lands on in a
 * river and drowns if that is water, is run over on roads and rails, and is lost if carried off the
 * edge. Classic: three lives, 30 seconds per crossing, 10 points per new row, 50 and the time left
 * for each burrow, 1000 for all five and a faster level. Endless: one life, the score is the furthest
 * row, and the view creeps forward on its own — fall behind it and a hawk takes you.
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';

export const COLS = 13;
export const SUB = 8;
export const W = COLS * SUB;
/** Room off each side where things wrap round unseen. */
const MARGIN = 6 * SUB;
const HOP = 6;
export const CLASSIC_ROWS = 13;
export const VIEW = 14;
export const BAYS = [1, 4, 6, 8, 11];
const LIFE_TIME = 30 * 60;

export type Dir = 'up' | 'down' | 'left' | 'right';
export type CrossAction = Dir | 'idle';
export const ACTIONS: readonly CrossAction[] = ['up', 'down', 'left', 'right', 'idle'];
const D: Record<Dir, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

export type LaneKind = 'safe' | 'road' | 'river' | 'goal' | 'grass' | 'rail';
export type ItemKind = 'car' | 'truck' | 'log' | 'turtle' | 'train';

export interface Item {
  at: number;
  len: number;
  kind: ItemKind;
}

export interface Lane {
  kind: LaneKind;
  dir: 1 | -1;
  /** Eighths of a column per step. */
  speed: number;
  /** The wrap-round length (the board plus room on both sides). */
  period: number;
  items: Item[];
  /** Turtles here dive now and then. */
  dives?: boolean;
  /** Columns with trees (grass). */
  trees?: number[];
  /** A colour index for drawing. */
  tint: number;
}

export interface CrossRules {
  id: string;
  endless: boolean;
}

export const CLASSIC: CrossRules = { id: 'crossing', endless: false };
export const ENDLESS: CrossRules = { id: 'endless-crossing', endless: true };

export interface Crossing {
  rules: string;
  rng: RngState;
  /** Lanes from row `base` upwards. */
  lanes: Lane[];
  base: number;
  /** Centre across (eighths) and row of the hedgehog. */
  x: number;
  y: number;
  facing: Dir;
  /** A hop in progress: direction and steps left. */
  hop: { dir: Dir; left: number } | null;
  /** The control held on the previous step (a hop starts on a press, or repeats while held). */
  prev: CrossAction;
  held: number;
  /** Furthest row this life (classic) or ever (endless). */
  best: number;
  lives: number;
  level: number;
  /** Burrows filled (classic). */
  filled: boolean[];
  /** A bonus beetle waiting in a burrow (classic): bay index and steps left. */
  beetle: { bay: number; left: number } | null;
  timer: number;
  /** The lowest row in view (endless), as a fraction. */
  camera: number;
  score: number;
  extraGiven: boolean;
  /** The death pause and how it happened. */
  dying: number;
  cause: string | null;
  over: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Where an item's left end is at a step (in eighths, 0 = the board's left edge). */
export function itemX(lane: Lane, item: Item, steps: number): number {
  return mod(item.at + lane.dir * lane.speed * steps, lane.period) - (lane.period - W) / 2;
}

/** Turtles under water now (and about to be: `soon`). */
export function submerged(
  lane: Lane,
  item: Item,
  steps: number,
): { under: boolean; soon: boolean } {
  if (!lane.dives || item.kind !== 'turtle') return { under: false, soon: false };
  const t = mod(steps + item.at * 7, 360);
  return { under: t >= 300, soon: t >= 250 && t < 300 };
}

/** A lane of evenly spread items with gaps; `lens` in columns. */
function spread(
  kind: LaneKind,
  dir: 1 | -1,
  speed: number,
  itemKind: ItemKind,
  lens: number[],
  gap: number,
  offset: number,
  tint: number,
  extra: Partial<Lane> = {},
): Lane {
  const items: Item[] = [];
  let at = offset;
  for (const l of lens) {
    items.push({ at, len: l * SUB, kind: itemKind });
    at += (l + gap) * SUB;
  }
  const period = Math.max(W + 2 * MARGIN, at - offset);
  return { kind, dir, speed, period, items, tint, ...extra };
}

/** The classic board for a level: start, five roads, a verge, five river lanes, the burrows. */
export function classicLanes(level: number): Lane[] {
  const f = 1 + 0.15 * (level - 1);
  const safe = (tint: number): Lane => ({
    kind: 'safe',
    dir: 1,
    speed: 0,
    period: W,
    items: [],
    tint,
  });
  return [
    safe(0),
    spread('road', -1, 0.35 * f, 'car', [1, 1, 1], 3, 0, 0),
    spread('road', 1, 0.3 * f, 'car', [1, 1, 1], 4, 10, 1),
    spread('road', -1, 0.45 * f, 'car', [1, 1, 1, 1], 2.5, 20, 2),
    spread('road', 1, 0.6 * f, 'car', [1], 12, 5, 3),
    spread('road', -1, 0.28 * f, 'truck', [2, 2], 5, 30, 4),
    safe(1),
    spread('river', -1, 0.3 * f, 'turtle', [3, 3, 3, 3], 1.5, 0, 0, { dives: level >= 2 }),
    spread('river', 1, 0.25 * f, 'log', [3, 3, 3], 3, 6, 1),
    spread('river', 1, 0.55 * f, 'log', [6, 6], 4, 12, 2),
    spread('river', -1, 0.35 * f, 'turtle', [2, 2, 2, 2], 2.5, 3, 3, { dives: true }),
    spread('river', 1, 0.4 * f, 'log', [4, 4, 4], 2.5, 20, 4),
    { kind: 'goal', dir: 1, speed: 0, period: W, items: [], tint: 0 },
  ];
}

/** One generated lane for the endless game at a row, given the lane below. */
function endlessLane(row: number, below: Lane | undefined, rng: RngState): [Lane, RngState] {
  let r: number;
  const roll = () => {
    [r, rng] = rand(rng);
    return r;
  };
  const hard = Math.min(1, Math.max(0, row) / 300);
  const grass = (): Lane => {
    const trees: number[] = [];
    const n = Math.floor(roll() * 4);
    for (let k = 0; k < n; k++) {
      const c = Math.floor(roll() * COLS);
      if (!trees.includes(c)) trees.push(c);
    }
    // At most three trees: a row of grass never walls the way off.
    return { kind: 'grass', dir: 1, speed: 0, period: W, items: [], trees, tint: row % 2 };
  };
  // A meadow to start on, hedged below.
  if (row < 4)
    return [
      {
        kind: 'grass',
        dir: 1,
        speed: 0,
        period: W,
        items: [],
        trees: row < -1 ? [0, 1, 2, 3, 4, 8, 9, 10, 11, 12] : row === 0 ? [0, 1, 11, 12] : [],
        tint: mod(row, 2),
      },
      rng,
    ];
  const p = roll();
  const dir: 1 | -1 = roll() < 0.5 ? 1 : -1;
  const kindRoll = below?.kind === 'rail' ? 0 : p;
  if (kindRoll < 0.3) return [grass(), rng];
  if (kindRoll < 0.62) {
    const truck = roll() < 0.3;
    const speed = (0.3 + roll() * 0.35) * (1 + hard);
    const count = 1 + Math.floor(roll() * 3);
    const gap = 3 + Math.floor(roll() * 4);
    return [
      spread(
        'road',
        dir,
        speed,
        truck ? 'truck' : 'car',
        new Array<number>(count).fill(truck ? 2 : 1),
        gap,
        Math.floor(roll() * W),
        Math.floor(roll() * 5),
      ),
      rng,
    ];
  }
  if (kindRoll < 0.9) {
    const speed = (0.2 + roll() * 0.25) * (1 + hard * 0.6);
    const lens = Array.from(
      { length: 2 + Math.floor(roll() * 2) },
      () => 2 + Math.floor(roll() * 3),
    );
    // Rivers next to rivers flow the other way.
    const d: 1 | -1 = below?.kind === 'river' ? (below.dir === 1 ? -1 : 1) : dir;
    return [
      spread('river', d, speed, 'log', lens, 2 + Math.floor(roll() * 2), Math.floor(roll() * W), 1),
      rng,
    ];
  }
  // A railway: one long train that comes round every few seconds.
  const lane: Lane = {
    kind: 'rail',
    dir,
    speed: 4,
    period: (8 + Math.floor(roll() * 6)) * 60 * 4,
    items: [{ at: Math.floor(roll() * 4000), len: Math.round(2.5 * W), kind: 'train' }],
    tint: 0,
  };
  return [lane, rng];
}

/** Steps until a lane's train reaches the board (0 while on it), for the signal. */
export function trainDue(lane: Lane, steps: number): number {
  const item = lane.items[0]!;
  for (let k = 0; k <= 90; k++) {
    const x = itemX(lane, item, steps + k);
    if (x < W && x + item.len > 0) return k;
  }
  return Infinity;
}

const laneAt = (s: Pick<Crossing, 'lanes' | 'base'>, row: number) => s.lanes[row - s.base];

function ensureLanes(s: Crossing, upTo: number): Crossing {
  if (s.base + s.lanes.length > upTo) return s;
  const lanes = [...s.lanes];
  let rng = s.rng;
  while (s.base + lanes.length <= upTo) {
    const [lane, n] = endlessLane(s.base + lanes.length, lanes[lanes.length - 1], rng);
    rng = n;
    lanes.push(lane);
  }
  // Forget lanes well behind the view.
  const drop = Math.max(0, Math.floor(s.camera) - 3 - s.base);
  return { ...s, lanes: lanes.slice(drop), base: s.base + drop, rng };
}

export function newCrossing(rules: CrossRules, seed: number): Crossing {
  const s: Crossing = {
    rules: rules.id,
    rng: seedRng(seed >>> 0),
    lanes: rules.endless ? [] : classicLanes(1),
    base: rules.endless ? -5 : 0,
    x: 6 * SUB + SUB / 2,
    y: 0,
    facing: 'up',
    hop: null,
    prev: 'idle',
    held: 0,
    best: 0,
    lives: rules.endless ? 1 : 3,
    level: 1,
    filled: BAYS.map(() => false),
    beetle: null,
    timer: LIFE_TIME,
    // The endless view starts a few rows below the hedgehog.
    camera: rules.endless ? -4 : 0,
    score: 0,
    extraGiven: false,
    dying: 0,
    cause: null,
    over: false,
    events: [],
    steps: 0,
  };
  return rules.endless ? ensureLanes(s, VIEW + 4) : s;
}

const column = (x: number) => Math.floor(x / SUB);

/** What the hedgehog is standing on now, if anything kills it. */
export function hazard(s: Crossing, x = s.x, y = s.y, steps = s.steps): string | null {
  const lane = laneAt(s, y);
  if (!lane) return null;
  if (lane.kind === 'road' || lane.kind === 'rail') {
    for (const it of lane.items) {
      const ix = itemX(lane, it, steps);
      if (x + 2.5 > ix && x - 2.5 < ix + it.len) return lane.kind === 'rail' ? 'train' : 'road';
    }
    return null;
  }
  if (lane.kind === 'river') {
    for (const it of lane.items) {
      const ix = itemX(lane, it, steps);
      if (x >= ix && x < ix + it.len && !submerged(lane, it, steps).under) return null;
    }
    return 'water';
  }
  return null;
}

function die(s: Crossing, cause: string, events: string[]): Crossing {
  return { ...s, dying: 60, cause, hop: null, events: [...events, 'die', cause] };
}

export function stepCrossing(rules: CrossRules, s0: Crossing, action: CrossAction): Crossing {
  if (s0.over) return s0;
  let s: Crossing = { ...s0, steps: s0.steps + 1, events: [] };
  const events: string[] = [];

  if (s.dying > 0) {
    s.dying--;
    if (s.dying > 0) return s;
    const lives = s.lives - 1;
    if (lives <= 0) return { ...s, lives: 0, over: true, events: ['over'] };
    return {
      ...s,
      lives,
      x: 6 * SUB + SUB / 2,
      y: 0,
      facing: 'up',
      best: 0,
      timer: LIFE_TIME,
      cause: null,
      prev: 'idle',
    };
  }

  // Hops: a fresh press starts one; holding repeats after a short pause.
  let pressed = false;
  if (action === 'idle') s.held = 0;
  else if (action !== s.prev) {
    pressed = true;
    s.held = 0;
  } else if (++s.held >= 14) {
    pressed = true;
    s.held = 0;
  }
  s.prev = action;
  if (!s.hop && pressed && action !== 'idle') {
    const [dx, dy] = D[action];
    const tx = column(s.x) + dx;
    const ty = s.y + dy;
    const target = laneAt(s, ty);
    const blocked =
      tx < 0 ||
      tx >= COLS ||
      ty < (rules.endless ? Math.ceil(s.camera) - 1 : 0) ||
      !target ||
      (target.kind === 'grass' && target.trees?.includes(tx));
    s.facing = action;
    if (!blocked) {
      s.hop = { dir: action, left: HOP };
      events.push('hop');
    }
  }

  // Riding a log or turtle in a river (not mid-hop).
  const here = laneAt(s, s.y);
  if (!s.hop && here?.kind === 'river') s.x += here.dir * here.speed;

  if (s.hop) {
    s.hop = { ...s.hop, left: s.hop.left - 1 };
    if (s.hop.left === 0) {
      const [dx, dy] = D[s.hop.dir];
      s.y += dy;
      const lane = laneAt(s, s.y)!;
      // Off a river, land in the middle of a column.
      s.x = lane.kind === 'river' ? s.x + dx * SUB : column(s.x + dx * SUB) * SUB + SUB / 2;
      s.hop = null;
      if (s.y > s.best) {
        if (!rules.endless) s.score += 10;
        s.best = s.y;
      }
      if (lane.kind === 'goal') {
        const col = column(s.x);
        const bay = BAYS.indexOf(col);
        if (bay < 0 || s.filled[bay]) return die(s, 'hedge', events);
        const filled = s.filled.map((f, i) => f || i === bay);
        let score = s.score + 50 + Math.floor(s.timer / 30);
        events.push('home');
        let beetle = s.beetle;
        if (beetle?.bay === bay) {
          score += 200;
          events.push('beetle');
          beetle = null;
        }
        s = {
          ...s,
          filled,
          score,
          beetle,
          x: 6 * SUB + SUB / 2,
          y: 0,
          best: 0,
          timer: LIFE_TIME,
          facing: 'up',
        };
        if (filled.every(Boolean)) {
          s = {
            ...s,
            score: s.score + 1000,
            level: s.level + 1,
            filled: BAYS.map(() => false),
            lanes: classicLanes(s.level + 1),
            beetle: null,
          };
          events.push('level');
        }
      }
    }
  }

  if (!s.hop) {
    if (s.x < 0 || s.x >= W) return die(s, 'edge', events);
    const h = hazard(s);
    if (h) return die(s, h, events);
  } else {
    // Lorries and trains still hit a hedgehog mid-hop on their lane.
    const lane = laneAt(s, s.y);
    if (lane && (lane.kind === 'road' || lane.kind === 'rail')) {
      const h = hazard(s);
      if (h) return die(s, h, events);
    }
  }

  if (rules.endless) {
    // The view creeps forward, faster the further you are, and keeps up with you.
    const creep = 0.004 + Math.min(0.006, s.best / 40000);
    const camera = Math.max(s.camera + creep, s.y - 6);
    s = ensureLanes({ ...s, camera, score: s.best }, Math.ceil(camera) + VIEW + 3);
    if (s.y < Math.floor(s.camera) && !s.hop) return die(s, 'hawk', events);
  } else {
    s.timer--;
    if (s.timer <= 0) return die(s, 'time', events);
    // A beetle visits an empty burrow now and then.
    if (s.beetle) {
      const left = s.beetle.left - 1;
      s.beetle = left > 0 ? { ...s.beetle, left } : null;
    } else if (s.steps % 600 === 300) {
      const empty = BAYS.map((_, i) => i).filter((i) => !s.filled[i]);
      const [r, n] = rand(s.rng);
      s.rng = n;
      if (empty.length) s.beetle = { bay: empty[Math.floor(r * empty.length)]!, left: 300 };
    }
    if (!s.extraGiven && s.score >= 5000) {
      s.lives++;
      s.extraGiven = true;
      events.push('extra');
    }
  }
  return { ...s, events };
}

/** One hop (or a wait as long as a hop) from a decision point, then `tail` idle steps; null if the hop is blocked. */
function tryHop(rules: CrossRules, s: Crossing, a: CrossAction, tail: number): Crossing | null {
  let t = s;
  if (a === 'idle')
    for (let k = 0; k < HOP && !t.dying && !t.over; k++) t = stepCrossing(rules, t, 'idle');
  else {
    t = stepCrossing(rules, { ...t, prev: 'idle' }, a);
    if (!t.hop && !t.dying && !t.over) return null;
    while (t.hop && !t.dying) t = stepCrossing(rules, t, 'idle');
  }
  for (let k = 0; k < tail && !t.dying && !t.over; k++) t = stepCrossing(rules, t, 'idle');
  return t;
}

const alive = (t: Crossing | null): t is Crossing => t !== null && !t.dying && !t.over;

function progressOf(rules: CrossRules, s0: Crossing, t: Crossing): number {
  if (t.dying || t.over) return -1e6;
  let v = t.score - s0.score + (t.y - s0.y) * 40;
  // On a river, being carried towards an edge is a slow death.
  const lane = laneAt(t, t.y);
  if (lane?.kind === 'river') {
    const room = lane.dir > 0 ? W - t.x : t.x;
    if (room < 5 * SUB) v -= (5 * SUB - room) * 3;
    // Standing on turtles about to dive.
    for (const it of lane.items) {
      const ix = itemX(lane, it, t.steps);
      if (t.x >= ix && t.x < ix + it.len && submerged(lane, it, t.steps).soon) v -= 150;
    }
  }
  if (rules.endless) return v + (t.y - t.camera) * 4 - Math.abs(column(t.x) - 6);
  // Across the river, line up with an empty burrow.
  if (t.y < 6) return v;
  // A burrow the current carries you towards is near; one it carries you away from is far.
  const drift = lane?.kind === 'river' ? lane.dir : 0;
  const gaps = BAYS.filter((_, i) => !t.filled[i]).map((c) => {
    const d = (c * SUB + SUB / 2 - t.x) / SUB;
    return drift === 0 || d * drift >= 0 ? Math.abs(d) * 0.5 : Math.abs(d) * 2 + 4;
  });
  return v - Math.min(99, ...gaps) * 3;
}

const MOVES: CrossAction[] = ['up', 'left', 'right', 'idle', 'down'];
const DEPTH = 6;
const BEAM = 40;
/** Waits already planned: the state each step of a wait leads to, and the plan's first move. */
const planned = new Map<string, CrossAction>();
const stateKey = (s: Crossing) =>
  `${s.rules}:${s.rng.join()}:${s.steps}:${s.y}:${s.x.toFixed(3)}:${s.lives}:${s.level}:${s.score}`;

/**
 * A planner: a beam search over the next six hops or waits (keeping the best 40 positions at each
 * depth, merging those that reach the same place at the same moment), scored on rows gained, score,
 * room from the edges, turtles about to dive and, across the river, lining up with an empty burrow.
 */
export function lookaheadPolicy(rules: CrossRules, s: Crossing): CrossAction {
  if (s.dying || s.hop || s.over) return 'idle';
  const memo = planned.get(stateKey(s));
  if (memo) return memo;
  type Node = { t: Crossing; first: CrossAction; v: number };
  let layer: Node[] = [{ t: s, first: 'idle', v: 0 }];
  let best: Node | null = null;
  for (let d = 0; d < DEPTH && layer.length; d++) {
    const next = new Map<string, Node>();
    for (const n of layer)
      for (const m of MOVES) {
        const t = tryHop(rules, n.t, m, d === DEPTH - 1 ? 12 : 0);
        if (!alive(t)) continue;
        const node = {
          t,
          first: d === 0 ? m : n.first,
          v: progressOf(rules, s, t) - (m === 'idle' ? 0.5 : 0) - (m === 'down' ? 1 : 0),
        };
        const key = `${t.y}:${Math.round(t.x)}:${t.steps}`;
        const old = next.get(key);
        if (!old || node.v > old.v) next.set(key, node);
      }
    layer = [...next.values()].sort((a, b) => b.v - a.v).slice(0, BEAM);
    if (layer[0] && (!best || d === DEPTH - 1 || layer[0].v > best.v)) best = layer[0];
  }
  const move = best?.first ?? 'up';
  if (move === 'idle') {
    // Remember the wait, so the next few steps need no new search.
    if (planned.size > 2000) planned.clear();
    let t = s;
    for (let k = 1; k < HOP; k++) {
      t = stepCrossing(rules, t, 'idle');
      if (t.dying || t.over) break;
      planned.set(stateKey(t), 'idle');
    }
  }
  return move;
}

/** A simple player: hops forward when it would survive the landing for a moment, else waits or sidesteps. */
export function hopperPolicy(rules: CrossRules, s: Crossing): CrossAction {
  if (s.dying || s.hop || s.over) return 'idle';
  for (const a of ['up', 'idle', 'left', 'right'] as const)
    if (alive(tryHop(rules, s, a, 10))) return a;
  return 'up';
}

export function isCrossing(d: unknown, rules: CrossRules): d is Crossing {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Crossing;
  return (
    s.rules === rules.id &&
    Array.isArray(s.rng) &&
    Array.isArray(s.lanes) &&
    Number.isFinite(s.x) &&
    Number.isFinite(s.score)
  );
}
