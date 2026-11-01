/**
 * Falling blocks, shared by the modern game (#174) and the classic 8-bit-style game (#175): a
 * 10-wide well, 20 rows tall plus two hidden rows above, at 60 steps a second. Pieces fall one row
 * per gravity interval; complete rows clear. Modern rules: rotation with wall kicks, a 7-piece bag,
 * five pieces of preview, hold, hard drop, a ghost piece, a half-second lock delay (reset by moves,
 * up to 15 times), T-spins, back-to-back and combo bonuses, levels every ten lines with the standard
 * gravity curve; the marathon ends at 150 lines, the sprint at 40. Classic rules: no kicks, one
 * piece of preview, a nearly-uniform random draw (rerolled once on a repeat), soft drop only, the
 * classic per-level gravity table and level progression, 40/100/300/1200 × (level + 1) scoring,
 * slower auto-repeat.
 *
 * Inputs are held controls each step; the simulation turns presses into single moves (rotations,
 * hard drop, hold) and holds into auto-repeat.
 */
import { nextUint32, seedRng, type RngState } from '../../../core/game-engine/random';
import { boxSize, cells, kicks, KINDS, type Kind } from './pieces';

export const COLS = 10;
export const ROWS = 22;
export const HIDDEN = 2;

export interface BlockRules {
  id: string;
  modern: boolean;
}
export const MODERN: BlockRules = { id: 'falling-blocks', modern: true };
export const CLASSIC: BlockRules = { id: 'falling-blocks-classic', modern: false };

/** The held controls this step, packed: L/R move, C/A rotate (clockwise / anticlockwise), S soft drop, H hard drop, K hold. */
export type BlockAction = string;
export function actionsFor(modern: boolean): string[] {
  const out: string[] = ['idle'];
  for (const m of ['', 'L', 'R'])
    for (const r of ['', 'C', 'A'])
      for (const d of modern ? ['', 'S', 'H'] : ['', 'S'])
        for (const k of modern ? ['', 'K'] : ['']) {
          const a = `${m}${r}${d}${k}`;
          if (a) out.push(a);
        }
  return out;
}

export interface Piece {
  kind: Kind;
  r: number;
  x: number;
  y: number;
}

export interface Blocks {
  rules: string;
  rng: RngState;
  /** Row-major, top first; null for empty. */
  board: (Kind | null)[];
  piece: Piece | null;
  queue: Kind[];
  bag: Kind[];
  hold: Kind | null;
  holdUsed: boolean;
  /** Spawn delay after a lock or clear (steps). */
  entry: number;
  /** Rows being cleared (shown flashing during the entry delay). */
  clearing: number[];
  level: number;
  startLevel: number;
  lines: number;
  /** Lines to clear for the run to end (0 = endless). */
  goal: number;
  score: number;
  fall: number;
  lock: number;
  resets: number;
  das: { dir: -1 | 0 | 1; timer: number };
  /** Controls held on the previous step (for presses). */
  prev: string;
  lastRotate: boolean;
  combo: number;
  b2b: boolean;
  last: { lines: number; tspin: boolean; b2b: boolean; points: number } | null;
  tetrises: number;
  tspins: number;
  over: boolean;
  won: boolean;
  events: string[];
  steps: number;
}

function rand(rng: RngState): [number, RngState] {
  const [x, next] = nextUint32(rng);
  return [x / 2 ** 32, next];
}

/** Frames per row: the modern curve by level, or the classic table. */
export function gravity(rules: BlockRules, level: number): number {
  if (rules.modern) return Math.max(1, 60 * Math.pow(0.8 - (level - 1) * 0.007, level - 1));
  const table = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3];
  return level < table.length ? table[level]! : level < 29 ? 2 : 1;
}

function draw(
  rules: BlockRules,
  rng: RngState,
  bag: Kind[],
  last: Kind | null,
): [Kind, RngState, Kind[]] {
  if (rules.modern) {
    let b = bag;
    let r = rng;
    if (!b.length) {
      b = [...KINDS];
      for (let i = b.length - 1; i > 0; i--) {
        const [x, n] = rand(r);
        r = n;
        const j = Math.floor(x * (i + 1));
        [b[i], b[j]] = [b[j]!, b[i]!];
      }
    }
    return [b[0]!, r, b.slice(1)];
  }
  // Classic: draw from eight (the eighth or a repeat rerolls once, from seven).
  const [x, n] = rand(rng);
  let k = Math.floor(x * 8);
  let r = n;
  if (k === 7 || KINDS[k] === last) {
    const [y, n2] = rand(r);
    r = n2;
    k = Math.floor(y * 7);
  }
  return [KINDS[k]!, r, bag];
}

export function fits(board: (Kind | null)[], p: Piece): boolean {
  return cells(p.kind, p.r).every(([cx, cy]) => {
    const x = p.x + cx;
    const y = p.y + cy;
    return x >= 0 && x < COLS && y < ROWS && (y < 0 || board[y * COLS + x] === null);
  });
}

const spawnPiece = (kind: Kind): Piece => ({
  kind,
  r: 0,
  x: boxSize(kind) === 2 ? 4 : 3,
  y: kind === 'I' ? 0 : 0,
});

export function newBlocks(
  rules: BlockRules,
  seed: number,
  options: { startLevel?: number; goal?: number } = {},
): Blocks {
  let rng = seedRng(seed >>> 0);
  let bag: Kind[] = [];
  const queue: Kind[] = [];
  let last: Kind | null = null;
  for (let i = 0; i < (rules.modern ? 6 : 2); i++) {
    const [k, r, b] = draw(rules, rng, bag, last);
    rng = r;
    bag = b;
    queue.push(k);
    last = k;
  }
  const level = options.startLevel ?? (rules.modern ? 1 : 0);
  return {
    rules: rules.id,
    rng,
    board: new Array<Kind | null>(COLS * ROWS).fill(null),
    piece: spawnPiece(queue[0]!),
    queue: queue.slice(1),
    bag,
    hold: null,
    holdUsed: false,
    entry: 0,
    clearing: [],
    level,
    startLevel: level,
    lines: 0,
    goal: options.goal ?? 0,
    score: 0,
    fall: 0,
    lock: 0,
    resets: 0,
    das: { dir: 0, timer: 0 },
    prev: '',
    lastRotate: false,
    combo: -1,
    b2b: false,
    last: null,
    tetrises: 0,
    tspins: 0,
    over: false,
    won: false,
    events: [],
    steps: 0,
  };
}

/** The lowest the piece can drop to. */
export function dropY(board: (Kind | null)[], p: Piece): number {
  let y = p.y;
  while (fits(board, { ...p, y: y + 1 })) y++;
  return y;
}

/** Classic level progression: the first level-up after min(10·start + 10, max(100, 10·start − 50)) lines. */
function levelFor(rules: BlockRules, start: number, lines: number): number {
  if (rules.modern) return start + Math.floor(lines / 10);
  const first = Math.min(start * 10 + 10, Math.max(100, start * 10 - 50));
  return lines < first ? start : start + 1 + Math.floor((lines - first) / 10);
}

const MODERN_POINTS = [0, 100, 300, 500, 800];
const TSPIN_POINTS = [400, 800, 1200, 1600];
const CLASSIC_POINTS = [0, 40, 100, 300, 1200];

export function stepBlocks(rules: BlockRules, s: Blocks, action: BlockAction): Blocks {
  if (s.over) return s;
  const a = action === 'idle' ? '' : action;
  const pressed = (c: string) => a.includes(c) && !s.prev.includes(c);
  const events: string[] = [];
  let {
    board,
    piece,
    queue,
    bag,
    hold,
    holdUsed,
    entry,
    clearing,
    level,
    lines,
    score,
    fall,
    lock,
    resets,
    das,
    rng,
    combo,
    b2b,
    tetrises,
    tspins,
    lastRotate,
  } = s;
  const step = { ...s, steps: s.steps + 1, prev: a };

  // Waiting for the next piece (and the cleared rows to vanish).
  if (!piece) {
    entry--;
    if (entry > 0) return { ...step, entry, events };
    if (clearing.length) {
      const keep = board.filter((_, i) => !clearing.includes(Math.floor(i / COLS)));
      board = [...new Array<Kind | null>(clearing.length * COLS).fill(null), ...keep];
      clearing = [];
    }
    const kind = queue[0]!;
    const [k, r, b] = draw(rules, rng, bag, queue[queue.length - 1] ?? null);
    rng = r;
    bag = b;
    queue = [...queue.slice(1), k];
    piece = spawnPiece(kind);
    if (!fits(board, piece))
      return { ...step, board, clearing, piece, queue, bag, rng, over: true, events: ['topout'] };
    return {
      ...step,
      board,
      clearing,
      piece,
      queue,
      bag,
      rng,
      holdUsed: false,
      fall: 0,
      lock: 0,
      resets: 0,
      lastRotate: false,
      events,
    };
  }

  let p = { ...piece };
  const onGround = () => !fits(board, { ...p, y: p.y + 1 });
  const moved = () => {
    // A successful move or rotation on the ground resets the modern lock delay (up to 15 times).
    if (rules.modern && onGround() && resets < 15) {
      lock = 0;
      resets++;
    }
  };

  // Hold (modern).
  if (rules.modern && pressed('K') && !holdUsed) {
    const swap = hold;
    hold = p.kind;
    holdUsed = true;
    events.push('hold');
    if (swap) p = spawnPiece(swap);
    else {
      const kind = queue[0]!;
      const [k, r, b] = draw(rules, rng, bag, queue[queue.length - 1] ?? null);
      rng = r;
      bag = b;
      queue = [...queue.slice(1), k];
      p = spawnPiece(kind);
    }
    if (!fits(board, p))
      return { ...step, piece: p, hold, holdUsed, queue, bag, rng, over: true, events: ['topout'] };
    fall = 0;
    lock = 0;
    resets = 0;
  }

  // Rotation (on presses).
  for (const [c, dirR] of [
    ['C', 1],
    ['A', -1],
  ] as const) {
    if (!pressed(c)) continue;
    const to = (p.r + dirR + 4) % 4;
    for (const [kx, ky] of kicks(p.kind, p.r, to, rules.modern)) {
      const cand = { ...p, r: to, x: p.x + kx, y: p.y + ky };
      if (fits(board, cand)) {
        p = cand;
        lastRotate = true;
        events.push('rotate');
        moved();
        break;
      }
    }
  }

  // Sideways moves with auto-repeat.
  const dir: -1 | 0 | 1 =
    a.includes('L') && !a.includes('R') ? -1 : a.includes('R') && !a.includes('L') ? 1 : 0;
  const [delay, repeat] = rules.modern ? [10, 2] : [16, 6];
  let shift = false;
  if (dir === 0) das = { dir: 0, timer: 0 };
  else if (das.dir !== dir) {
    das = { dir, timer: 0 };
    shift = true;
  } else {
    const t = das.timer + 1;
    das = { dir, timer: t };
    shift = t >= delay && (t - delay) % repeat === 0;
  }
  if (shift && fits(board, { ...p, x: p.x + dir })) {
    p = { ...p, x: p.x + dir };
    lastRotate = false;
    events.push('move');
    moved();
  }

  // Hard drop (modern).
  let locked = false;
  if (rules.modern && pressed('H')) {
    const y = dropY(board, p);
    score += (y - p.y) * 2;
    if (y > p.y) lastRotate = false;
    p = { ...p, y };
    locked = true;
    events.push('drop');
  }

  // Gravity, faster while soft dropping.
  if (!locked) {
    const soft = a.includes('S');
    const g = gravity(rules, level);
    const interval = soft ? (rules.modern ? Math.max(1, g / 20) : Math.min(g, 2)) : g;
    fall += 1;
    if (fall >= interval) {
      fall = 0;
      if (fits(board, { ...p, y: p.y + 1 })) {
        p = { ...p, y: p.y + 1 };
        lastRotate = false;
        if (soft) score += 1;
        if (rules.modern) lock = 0;
      } else if (!rules.modern) locked = true;
    }
    if (rules.modern && onGround()) {
      lock++;
      if (lock >= 30) locked = true;
    }
  }

  if (!locked)
    return {
      ...step,
      piece: p,
      hold,
      holdUsed,
      queue,
      bag,
      rng,
      score,
      fall,
      lock,
      resets,
      das,
      lastRotate,
      events,
    };

  // Lock the piece.
  board = [...board];
  let aboveTop = true;
  for (const [cx, cy] of cells(p.kind, p.r)) {
    const y = p.y + cy;
    if (y >= HIDDEN) aboveTop = false;
    if (y >= 0) board[y * COLS + p.x + cx] = p.kind;
  }
  events.push('lock');
  // T-spin: a T locked right after a rotation with three of its four box corners filled.
  let tspin = false;
  if (rules.modern && p.kind === 'T' && lastRotate) {
    const corners = [
      [0, 0],
      [2, 0],
      [0, 2],
      [2, 2],
    ].filter(([cx, cy]) => {
      const x = p.x + cx!;
      const y = p.y + cy!;
      return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y * COLS + x] !== null);
    }).length;
    tspin = corners >= 3;
  }
  const full: number[] = [];
  for (let y = 0; y < ROWS; y++)
    if (board.slice(y * COLS, (y + 1) * COLS).every((c) => c !== null)) full.push(y);
  const n = full.length;
  let points: number;
  let last: Blocks['last'];
  if (rules.modern) {
    points = (tspin ? TSPIN_POINTS[n]! : MODERN_POINTS[n]!) * level;
    const difficult = n === 4 || (tspin && n > 0);
    const wasB2b = b2b && difficult;
    if (wasB2b) points = Math.floor(points * 1.5);
    if (n > 0) {
      b2b = difficult;
      combo++;
      if (combo > 0) points += 50 * combo * level;
    } else combo = -1;
    last = n > 0 || tspin ? { lines: n, tspin, b2b: wasB2b, points } : null;
  } else {
    points = CLASSIC_POINTS[n]! * (level + 1);
    last = n > 0 ? { lines: n, tspin: false, b2b: false, points } : null;
  }
  score += points;
  if (n === 4) tetrises++;
  if (n > 0) events.push(n === 4 ? 'four' : 'clear');
  if (tspin) {
    events.push('tspin');
    tspins++;
  }
  lines += n;
  level = levelFor(rules, s.startLevel, lines);
  if (level > s.level) events.push('level');
  const won = s.goal > 0 && lines >= s.goal;
  if (won)
    return {
      ...step,
      board,
      piece: null,
      clearing: full,
      score,
      lines,
      level,
      combo,
      b2b,
      last,
      tetrises,
      tspins,
      over: true,
      won: true,
      events: [...events, 'goal'],
    };
  if (rules.modern && aboveTop)
    return {
      ...step,
      board,
      piece: null,
      score,
      lines,
      level,
      over: true,
      events: [...events, 'topout'],
    };
  return {
    ...step,
    board,
    piece: null,
    hold,
    holdUsed,
    queue,
    bag,
    rng,
    entry: n > 0 ? 20 : rules.modern ? 2 : 10,
    clearing: full,
    score,
    lines,
    level,
    fall: 0,
    lock: 0,
    resets: 0,
    das,
    combo,
    b2b,
    last,
    tetrises,
    tspins,
    lastRotate: false,
    events,
  };
}

export function isBlocks(d: unknown, rules: BlockRules): d is Blocks {
  if (typeof d !== 'object' || d === null) return false;
  const s = d as Blocks;
  return (
    s.rules === rules.id &&
    Array.isArray(s.rng) &&
    Array.isArray(s.board) &&
    s.board.length === COLS * ROWS &&
    Array.isArray(s.queue) &&
    Number.isFinite(s.score)
  );
}
