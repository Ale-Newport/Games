/**
 * A two-phase 3×3 solver after Herbert Kociemba's algorithm. Phase 1 brings the cube into the
 * subgroup ⟨U, D, R2, L2, F2, B2⟩ (corner twist, edge flip and the four middle-layer edges
 * home); phase 2 solves it within that subgroup. Each phase is an iterative-deepening search over
 * coordinate move tables, guided by pruning tables of exact distances for pairs of coordinates.
 * Tables are built on first use (a few hundred milliseconds); solutions are near-optimal.
 */
import { FACES, type Cube, type Face, type Turn } from './cube';

interface Cubies {
  cp: number[];
  co: number[];
  ep: number[];
  eo: number[];
}

const BASIC: Record<Face, Cubies> = {
  U: {
    cp: [3, 0, 1, 2, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: Array(12).fill(0),
  },
  R: {
    cp: [4, 1, 2, 0, 7, 5, 6, 3],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
    eo: Array(12).fill(0),
  },
  F: {
    cp: [1, 5, 2, 3, 0, 4, 6, 7],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  D: {
    cp: [0, 1, 2, 3, 5, 6, 7, 4],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
    eo: Array(12).fill(0),
  },
  L: {
    cp: [0, 2, 6, 3, 4, 1, 5, 7],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11],
    eo: Array(12).fill(0),
  },
  B: {
    cp: [0, 1, 3, 7, 4, 5, 2, 6],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
};

function multiply(a: Cubies, b: Cubies): Cubies {
  return {
    cp: b.cp.map((x) => a.cp[x]!),
    co: b.cp.map((x, i) => (a.co[x]! + b.co[i]!) % 3),
    ep: b.ep.map((x) => a.ep[x]!),
    eo: b.ep.map((x, i) => (a.eo[x]! + b.eo[i]!) % 2),
  };
}

const IDENTITY: Cubies = {
  cp: [0, 1, 2, 3, 4, 5, 6, 7],
  co: Array(8).fill(0),
  ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  eo: Array(12).fill(0),
};

/** The 18 moves (face × quarter, half, three-quarter) as cubie permutations. */
const MOVES: { turn: Turn; cubies: Cubies }[] = FACES.flatMap((face) => {
  let c = IDENTITY;
  return ([1, 2, 3] as const).map((amount) => {
    c = multiply(c, BASIC[face]);
    return { turn: { face, depth: 1, amount }, cubies: c };
  });
});
const FACE_OF = MOVES.map((m) => m.turn.face);
const OPP: Record<Face, Face> = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };
/** Phase 2 move indices: U*, D*, and half turns of R, L, F, B. */
const PHASE2 = MOVES.flatMap((m, i) =>
  m.turn.face === 'U' || m.turn.face === 'D' || m.turn.amount === 2 ? [i] : [],
);

// --- coordinates ---------------------------------------------------------------------------

const twistOf = (c: Cubies) => c.co.slice(0, 7).reduce((k, x) => k * 3 + x, 0);
const flipOf = (c: Cubies) => c.eo.slice(0, 11).reduce((k, x) => k * 2 + x, 0);
function binom(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
/** Which four positions hold the middle-layer edges (8–11): 0..494, 0 when they are home. */
function sliceOf(c: Cubies) {
  let k = 0;
  let found = 0;
  for (let i = 11; i >= 0; i--)
    if (c.ep[i]! >= 8) {
      k += binom(11 - i, found + 1);
      found++;
    }
  return k;
}
function permIndex(p: readonly number[]) {
  let k = 0;
  for (let i = 0; i < p.length; i++) {
    let smaller = 0;
    for (let j = i + 1; j < p.length; j++) if (p[j]! < p[i]!) smaller++;
    k = k * (p.length - i) + smaller;
  }
  return k;
}
const cornerPermOf = (c: Cubies) => permIndex(c.cp);
const udEdgePermOf = (c: Cubies) => permIndex(c.ep.slice(0, 8));
const slicePermOf = (c: Cubies) => permIndex(c.ep.slice(8).map((x) => x - 8));

// Representatives for each coordinate value, to build the move tables.
function withTwist(k: number): Cubies {
  const co = Array(8).fill(0);
  let s = 0;
  for (let i = 6; i >= 0; i--) {
    co[i] = k % 3;
    s += co[i];
    k = Math.floor(k / 3);
  }
  co[7] = (3 - (s % 3)) % 3;
  return { ...IDENTITY, co };
}
function withFlip(k: number): Cubies {
  const eo = Array(12).fill(0);
  let s = 0;
  for (let i = 10; i >= 0; i--) {
    eo[i] = k % 2;
    s += eo[i];
    k = Math.floor(k / 2);
  }
  eo[11] = s % 2;
  return { ...IDENTITY, eo };
}
function withSlice(k: number): Cubies {
  const ep = Array(12).fill(-1);
  let found = 4;
  for (let i = 0; i < 12 && found > 0; i++) {
    const b = binom(11 - i, found);
    if (k >= b) {
      k -= b;
      ep[i] = 7 + found;
      found--;
    }
  }
  let other = 0;
  for (let i = 0; i < 12; i++) if (ep[i] === -1) ep[i] = other++;
  return { ...IDENTITY, ep };
}
function nthPerm(k: number, n: number) {
  const items = Array.from({ length: n }, (_, i) => i);
  const fact = (m: number): number => (m <= 1 ? 1 : m * fact(m - 1));
  const out: number[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const f = fact(i);
    out.push(items.splice(Math.floor(k / f), 1)[0]!);
    k %= f;
  }
  return out;
}
const withCornerPerm = (k: number): Cubies => ({ ...IDENTITY, cp: nthPerm(k, 8) });
const withUdEdgePerm = (k: number): Cubies => ({
  ...IDENTITY,
  ep: [...nthPerm(k, 8), 8, 9, 10, 11],
});
const withSlicePerm = (k: number): Cubies => ({
  ...IDENTITY,
  ep: [0, 1, 2, 3, 4, 5, 6, 7, ...nthPerm(k, 4).map((x) => x + 8)],
});

function moveTable(
  size: number,
  build: (k: number) => Cubies,
  read: (c: Cubies) => number,
  moves: number[],
) {
  const t = new Uint16Array(size * 18);
  for (let k = 0; k < size; k++) {
    const c = build(k);
    for (const m of moves) t[k * 18 + m] = read(multiply(c, MOVES[m]!.cubies));
  }
  return t;
}

function pruneTable(
  sizeA: number,
  sizeB: number,
  moveA: Uint16Array,
  moveB: Uint16Array,
  moves: number[],
  start: number,
) {
  const t = new Int8Array(sizeA * sizeB).fill(-1);
  t[start] = 0;
  let frontier = [start];
  for (let d = 1; frontier.length; d++) {
    const next: number[] = [];
    for (const k of frontier) {
      const a = Math.floor(k / sizeB);
      const b = k % sizeB;
      for (const m of moves) {
        const n = moveA[a * 18 + m]! * sizeB + moveB[b * 18 + m]!;
        if (t[n] === -1) {
          t[n] = d;
          next.push(n);
        }
      }
    }
    frontier = next;
  }
  return t;
}

interface Tables {
  twist: Uint16Array;
  flip: Uint16Array;
  slice: Uint16Array;
  cperm: Uint16Array;
  eperm: Uint16Array;
  sperm: Uint16Array;
  twistSlice: Int8Array;
  flipSlice: Int8Array;
  cpermSperm: Int8Array;
  epermSperm: Int8Array;
}
let tables: Tables | null = null;
export function twoPhaseTables(): Tables {
  if (tables) return tables;
  const all = MOVES.map((_, i) => i);
  const twist = moveTable(2187, withTwist, twistOf, all);
  const flip = moveTable(2048, withFlip, flipOf, all);
  const slice = moveTable(495, withSlice, sliceOf, all);
  const cperm = moveTable(40320, withCornerPerm, cornerPermOf, PHASE2);
  const eperm = moveTable(40320, withUdEdgePerm, udEdgePermOf, PHASE2);
  const sperm = moveTable(24, withSlicePerm, slicePermOf, PHASE2);
  tables = {
    twist,
    flip,
    slice,
    cperm,
    eperm,
    sperm,
    twistSlice: pruneTable(2187, 495, twist, slice, all, 0),
    flipSlice: pruneTable(2048, 495, flip, slice, all, 0),
    cpermSperm: pruneTable(40320, 24, cperm, sperm, PHASE2, 0),
    epermSperm: pruneTable(40320, 24, eperm, sperm, PHASE2, 0),
  };
  return tables;
}

// --- reading stickers ----------------------------------------------------------------------

const AXIS: Record<Face, [number, number]> = {
  R: [0, 1],
  L: [0, -1],
  U: [1, 1],
  D: [1, -1],
  F: [2, 1],
  B: [2, -1],
};
const faceOf = (normal: readonly number[]): Face =>
  FACES.find((f) => normal[AXIS[f][0]] === AXIS[f][1])!;
const CORNER_FACELETS: Face[][] = [
  ['U', 'R', 'F'],
  ['U', 'F', 'L'],
  ['U', 'L', 'B'],
  ['U', 'B', 'R'],
  ['D', 'F', 'R'],
  ['D', 'L', 'F'],
  ['D', 'B', 'L'],
  ['D', 'R', 'B'],
];
const EDGE_FACELETS: Face[][] = [
  ['U', 'R'],
  ['U', 'F'],
  ['U', 'L'],
  ['U', 'B'],
  ['D', 'R'],
  ['D', 'F'],
  ['D', 'L'],
  ['D', 'B'],
  ['F', 'R'],
  ['F', 'L'],
  ['B', 'L'],
  ['B', 'R'],
];

/** Reads cubies from a 3×3 sticker cube (centres never move: only outer faces turn). */
export function readCubies(cube: Cube): Cubies | null {
  const at = new Map<string, Face>();
  for (const st of cube) at.set(`${st.pos.join(',')}|${faceOf(st.normal)}`, st.color);
  const read = (facelets: Face[]) => {
    const centre = [0, 0, 0];
    for (const f of facelets) centre[AXIS[f][0]] = AXIS[f][1] * 2;
    return facelets.map((f) => {
      const p = [...centre];
      p[AXIS[f][0]] = AXIS[f][1] * 3;
      return at.get(`${p.join(',')}|${f}`);
    });
  };
  const key = (xs: (Face | undefined)[]) => [...xs].sort().join('');
  const cp: number[] = [];
  const co: number[] = [];
  for (const f of CORNER_FACELETS) {
    const colors = read(f);
    const piece = CORNER_FACELETS.findIndex((x) => key(x) === key(colors));
    const twist = colors.findIndex((c) => c === 'U' || c === 'D');
    if (piece < 0 || twist < 0) return null;
    cp.push(piece);
    co.push(twist);
  }
  const ep: number[] = [];
  const eo: number[] = [];
  for (const f of EDGE_FACELETS) {
    const colors = read(f);
    const piece = EDGE_FACELETS.findIndex((x) => key(x) === key(colors));
    if (piece < 0) return null;
    ep.push(piece);
    eo.push(colors[0] === EDGE_FACELETS[piece]![0] ? 0 : 1);
  }
  return { cp, co, ep, eo };
}

// --- search --------------------------------------------------------------------------------

/**
 * Solves a 3×3 sticker cube: the first solution of at most `target` moves, or the shortest found
 * within `timeMs`. Null when the stickers do not form a reachable cube.
 */
export function solveTwoPhase(cube: Cube, target = 22, timeMs = 300): Turn[] | null {
  const start = readCubies(cube);
  if (!start) return null;
  const T = twoPhaseTables();
  const twist0 = twistOf(start);
  const flip0 = flipOf(start);
  const slice0 = sliceOf(start);
  if (
    twist0 === 0 &&
    flip0 === 0 &&
    slice0 === 0 &&
    cornerPermOf(start) === 0 &&
    udEdgePermOf(start) === 0 &&
    slicePermOf(start) === 0
  )
    return [];
  const deadline = Date.now() + timeMs;
  const p1: number[] = [];
  const p2: number[] = [];
  let best: number[] | null = null;
  let bestLen = target + 1;

  const allowed = (m: number, prev: number) => {
    if (prev < 0) return true;
    const f = FACE_OF[m]!;
    const g = FACE_OF[prev]!;
    // No two turns of one face in a row, and opposite faces only in one order.
    return f !== g && !(OPP[f] === g && f < g);
  };

  const phase2 = (cp: number, ep: number, sp: number, depth: number, prev: number): boolean => {
    if (depth === 0) return cp === 0 && ep === 0 && sp === 0;
    const h = Math.max(T.cpermSperm[cp * 24 + sp]!, T.epermSperm[ep * 24 + sp]!);
    if (h > depth) return false;
    for (const m of PHASE2) {
      if (!allowed(m, prev)) continue;
      p2.push(m);
      if (phase2(T.cperm[cp * 18 + m]!, T.eperm[ep * 18 + m]!, T.sperm[sp * 18 + m]!, depth - 1, m))
        return true;
      p2.pop();
    }
    return false;
  };

  const startPhase2 = (): boolean => {
    let c = start;
    for (const m of p1) c = multiply(c, MOVES[m]!.cubies);
    const cp = cornerPermOf(c);
    const ep = udEdgePermOf(c);
    const sp = slicePermOf(c);
    const prev = p1.length ? p1[p1.length - 1]! : -1;
    for (let d2 = 0; p1.length + d2 < bestLen; d2++) {
      p2.length = 0;
      if (phase2(cp, ep, sp, d2, prev)) {
        best = [...p1, ...p2];
        bestLen = best.length;
        return bestLen <= target;
      }
    }
    return false;
  };

  const phase1 = (tw: number, fl: number, sl: number, depth: number, prev: number): boolean => {
    if (Date.now() > deadline && best) return true;
    if (depth === 0) {
      if (tw === 0 && fl === 0 && sl === 0) {
        // A phase-1 solution ending in a phase-2 move would just be a longer phase 2.
        if (prev >= 0 && PHASE2.includes(prev) && p1.length > 0) return false;
        return startPhase2();
      }
      return false;
    }
    const h = Math.max(T.twistSlice[tw * 495 + sl]!, T.flipSlice[fl * 495 + sl]!);
    // Reaching the subgroup before the planned depth: that shorter phase 1 is tried on its own.
    if (h > depth || h === 0) return false;
    for (let m = 0; m < 18; m++) {
      if (!allowed(m, prev)) continue;
      p1.push(m);
      if (phase1(T.twist[tw * 18 + m]!, T.flip[fl * 18 + m]!, T.slice[sl * 18 + m]!, depth - 1, m))
        return true;
      p1.pop();
    }
    return false;
  };

  for (let d1 = 0; d1 <= 12 && d1 < bestLen; d1++) {
    p1.length = 0;
    if (d1 === 0) {
      if (twist0 === 0 && flip0 === 0 && slice0 === 0 && startPhase2()) break;
      continue;
    }
    if (phase1(twist0, flip0, slice0, d1, -1)) break;
    if (Date.now() > deadline && best) break;
  }
  return best ? (best as number[]).map((m) => MOVES[m]!.turn) : null;
}
