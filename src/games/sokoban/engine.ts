/**
 * Sokoban rules and solver. The keeper walks the warehouse and pushes boxes (never pulls them, one
 * at a time) until every box rests on a goal. Levels come from `levels.ts`, generated offline by
 * this project's generator (a random room, boxes on goals, every position reachable by pulling
 * explored, the one farthest from solved kept), each with its fewest-push count.
 */
import { LEVELS } from './levels';

export const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] } as const;
export type Dir = keyof typeof DIRS;

export interface Warehouse {
  width: number;
  height: number;
  walls: boolean[];
  goals: number[];
  boxes: number[];
  player: number;
  /** Fewest pushes to solve. */
  pushes: number;
}

export function parseLevel(text: string, pushes: number): Warehouse {
  const rows = text.split('|');
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const walls: boolean[] = [];
  const goals: number[] = [];
  const boxes: number[] = [];
  let player = -1;
  rows.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? '#';
      const c = y * width + x;
      walls.push(ch === '#');
      if (ch === '.' || ch === '*' || ch === '+') goals.push(c);
      if (ch === '$' || ch === '*') boxes.push(c);
      if (ch === '@' || ch === '+') player = c;
    }
  });
  return { width, height, walls, goals, boxes, player, pushes };
}

export const TIERS = ['easy', 'medium', 'hard'] as const;
export type Tier = (typeof TIERS)[number];

export function levelAt(tier: Tier, index: number): Warehouse {
  const entry = LEVELS[tier][index] ?? LEVELS[tier][0];
  const at = entry.lastIndexOf(':');
  return parseLevel(entry.slice(0, at), Number(entry.slice(at + 1)));
}

export const levelCount = (tier: Tier) => LEVELS[tier].length;

const step = (w: Pick<Warehouse, 'width'>, c: number, d: Dir) =>
  c + DIRS[d][0] + DIRS[d][1] * w.width;

/** Floor cells the keeper reaches without pushing. */
export function reachable(w: Warehouse, boxes: readonly number[], from: number): Set<number> {
  const blocked = new Set(boxes);
  const seen = new Set([from]);
  const stack = [from];
  while (stack.length) {
    const c = stack.pop()!;
    for (const d of Object.keys(DIRS) as Dir[]) {
      const x = step(w, c, d);
      if (!w.walls[x] && !blocked.has(x) && !seen.has(x)) {
        seen.add(x);
        stack.push(x);
      }
    }
  }
  return seen;
}

/** A shortest walk (directions) to `to` without pushing, or null. */
export function walkTo(
  w: Warehouse,
  boxes: readonly number[],
  from: number,
  to: number,
): Dir[] | null {
  if (from === to) return [];
  const blocked = new Set(boxes);
  const prev = new Map<number, [number, Dir]>();
  const queue = [from];
  prev.set(from, [-1, 'U']);
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q]!;
    for (const d of Object.keys(DIRS) as Dir[]) {
      const x = step(w, c, d);
      if (w.walls[x] || blocked.has(x) || prev.has(x)) continue;
      prev.set(x, [c, d]);
      if (x === to) {
        const path: Dir[] = [];
        for (let at = x; at !== from; at = prev.get(at)![0]) path.push(prev.get(at)![1]);
        return path.reverse();
      }
      queue.push(x);
    }
  }
  return null;
}

/** Cells from which a box can still reach some goal (by pulling back from the goals). */
export function liveCells(w: Warehouse): Set<number> {
  const live = new Set(w.goals);
  const queue = [...w.goals];
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q]!;
    for (const d of Object.keys(DIRS) as Dir[]) {
      const from = step(w, c, d);
      const keeper = step(w, from, d);
      if (!w.walls[from] && !w.walls[keeper] && !live.has(from)) {
        live.add(from);
        queue.push(from);
      }
    }
  }
  return live;
}

export const solvedBoxes = (w: Warehouse, boxes: readonly number[]) =>
  boxes.every((b) => w.goals.includes(b));

export interface Push {
  box: number;
  dir: Dir;
}

/**
 * Fewest-push solution by breadth-first search over (boxes, keeper region), pruning boxes on dead
 * cells. Null when unsolvable or over `limit` states.
 */
export function solvePushes(
  w: Warehouse,
  boxes: readonly number[],
  player: number,
  limit = 300_000,
): Push[] | null {
  const live = liveCells(w);
  if (boxes.some((b) => !live.has(b))) return null;
  const norm = (bx: number[], p: number) => {
    const r = reachable(w, bx, p);
    let min = p;
    for (const c of r) if (c < min) min = c;
    return { key: `${bx.join(',')}|${min}`, area: r };
  };
  const start = [...boxes].sort((a, b) => a - b);
  if (solvedBoxes(w, start)) return [];
  const first = norm(start, player);
  const prev = new Map<string, { from: string; push: Push } | null>([[first.key, null]]);
  let frontier = [{ bx: start, p: player, key: first.key, area: first.area }];
  while (frontier.length && prev.size < limit) {
    const next: typeof frontier = [];
    for (const s of frontier) {
      const set = new Set(s.bx);
      for (const b of s.bx)
        for (const d of Object.keys(DIRS) as Dir[]) {
          const behind = b - DIRS[d][0] - DIRS[d][1] * w.width;
          const ahead = step(w, b, d);
          if (!s.area.has(behind) || w.walls[ahead] || set.has(ahead) || !live.has(ahead)) continue;
          const bx = s.bx.map((x) => (x === b ? ahead : x)).sort((a, c) => a - c);
          const n = norm(bx, b);
          if (prev.has(n.key)) continue;
          prev.set(n.key, { from: s.key, push: { box: b, dir: d } });
          if (solvedBoxes(w, bx)) {
            const out: Push[] = [];
            for (let k = n.key; prev.get(k); k = prev.get(k)!.from) out.push(prev.get(k)!.push);
            return out.reverse();
          }
          next.push({ bx, p: b, key: n.key, area: n.area });
        }
    }
    frontier = next;
  }
  return null;
}

export interface SokobanState {
  tier: Tier;
  index: number;
  warehouse: Warehouse;
  boxes: number[];
  player: number;
  /** Earlier (boxes, player) positions for undo. */
  history: { boxes: number[]; player: number }[];
  moves: number;
  pushes: number;
  hints: number;
  elapsedMs: number;
  solved: boolean;
}

export function newSokoban(tier: Tier, index: number): SokobanState {
  const t: Tier = (TIERS as readonly string[]).includes(tier) ? tier : 'easy';
  const i = Math.min(Math.max(0, Math.floor(index) || 0), levelCount(t) - 1);
  const w = levelAt(t, i);
  return {
    tier: t,
    index: i,
    warehouse: w,
    boxes: [...w.boxes],
    player: w.player,
    history: [],
    moves: 0,
    pushes: 0,
    hints: 0,
    elapsedMs: 0,
    solved: false,
  };
}

/** One keeper step: walks, or pushes a box when the cell beyond it is free. */
export function stepPlayer(s: SokobanState, d: Dir): SokobanState {
  if (s.solved) return s;
  const w = s.warehouse;
  const to = step(w, s.player, d);
  if (w.walls[to]) return s;
  const i = s.boxes.indexOf(to);
  let boxes = s.boxes;
  if (i >= 0) {
    const beyond = step(w, to, d);
    if (w.walls[beyond] || s.boxes.includes(beyond)) return s;
    boxes = [...s.boxes];
    boxes[i] = beyond;
  }
  return {
    ...s,
    boxes,
    player: to,
    history: [...s.history, { boxes: s.boxes, player: s.player }].slice(-1000),
    moves: s.moves + 1,
    pushes: s.pushes + (i >= 0 ? 1 : 0),
    solved: i >= 0 && solvedBoxes(w, boxes),
  };
}

export function undo(s: SokobanState): SokobanState {
  const prev = s.history[s.history.length - 1];
  if (!prev || s.solved) return s;
  return { ...s, ...prev, history: s.history.slice(0, -1), moves: s.moves + 1 };
}

/** Boxes off goals that can never reach one (on a dead cell). */
export function deadBoxes(s: SokobanState): number[] {
  const live = liveCells(s.warehouse);
  return s.boxes.filter((b) => !live.has(b));
}

export function isValidSokobanState(d: unknown): d is SokobanState {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as SokobanState;
  if (!(TIERS as readonly string[]).includes(s.tier)) return false;
  if (!Number.isInteger(s.index) || s.index < 0 || s.index >= levelCount(s.tier)) return false;
  if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0) return false;
  for (const k of ['moves', 'pushes', 'hints'] as const)
    if (!Number.isInteger(s[k]) || s[k] < 0) return false;
  if (typeof s.solved !== 'boolean') return false;
  const w = levelAt(s.tier, s.index);
  if (JSON.stringify(w) !== JSON.stringify(s.warehouse)) return false;
  const ok = (bx: unknown, p: unknown) =>
    Array.isArray(bx) &&
    bx.length === w.boxes.length &&
    new Set(bx).size === bx.length &&
    bx.every((b) => Number.isInteger(b) && !w.walls[b as number]) &&
    Number.isInteger(p) &&
    !w.walls[p as number] &&
    !bx.includes(p);
  if (!ok(s.boxes, s.player) || !Array.isArray(s.history)) return false;
  if (!s.history.every((h) => typeof h === 'object' && h !== null && ok(h.boxes, h.player)))
    return false;
  return s.solved === solvedBoxes(w, s.boxes);
}
