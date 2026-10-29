/**
 * The shared core of the twisty cubes (2×2, 3×3, 4×4): an N×N×N cube as stickers with a position
 * and an outward normal in doubled integer coordinates, layer turns as quarter rotations of the
 * stickers in that layer, standard move notation (outer faces U D L R F B, wide moves like Rw on
 * the 4×4, primes and doubles), seeded scrambles, and inverse sequences.
 */
import { Rng } from '../../../core/game-engine/random';

export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

/** Axis index and the sign of the face's normal along it. */
const FACE_AXIS: Record<Face, [number, 1 | -1]> = {
  R: [0, 1],
  L: [0, -1],
  U: [1, 1],
  D: [1, -1],
  F: [2, 1],
  B: [2, -1],
};

export interface Sticker {
  /** Doubled coordinates: cubie centres at odd values −(N−1)…N−1, the face plane at ±N. */
  pos: [number, number, number];
  normal: [number, number, number];
  /** The face this sticker belongs to when solved (its color). */
  color: Face;
}

export type Cube = Sticker[];

export function solvedCube(n: number): Cube {
  const out: Cube = [];
  for (const f of FACES) {
    const [axis, sign] = FACE_AXIS[f];
    const others = [0, 1, 2].filter((a) => a !== axis) as [number, number];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const pos: [number, number, number] = [0, 0, 0];
        pos[axis] = sign * n;
        pos[others[0]] = -(n - 1) + 2 * i;
        pos[others[1]] = -(n - 1) + 2 * j;
        const normal: [number, number, number] = [0, 0, 0];
        normal[axis] = sign;
        out.push({ pos, normal, color: f });
      }
  }
  return out;
}

export interface Turn {
  face: Face;
  /** How many layers from that face turn together (1 = outer face, 2 = wide on the 4×4). */
  depth: number;
  /** Quarter turns clockwise as seen from the face: 1, 2 or 3 (= prime). */
  amount: 1 | 2 | 3;
}

/** Rotates a vector a quarter turn clockwise looking at the +axis face from outside. */
function rotate(v: readonly number[], axis: number, sign: 1 | -1): [number, number, number] {
  // Clockwise seen from the positive side is a negative rotation about the axis.
  const [x, y, z] = v as [number, number, number];
  const s = -sign;
  if (axis === 0) return [x, s * -z, s * y];
  if (axis === 1) return [s * z, y, s * -x];
  return [s * -y, s * x, z];
}

export function turn(cube: Cube, n: number, t: Turn): Cube {
  const [axis, sign] = FACE_AXIS[t.face];
  // Layers within `depth` of that face, judged by the sticker's cubie (a sticker on a face plane at
  // ±N belongs to the cubie one unit inside).
  const limit = n - 1 - 2 * t.depth;
  return cube.map((st) => {
    const c = st.pos[axis]!;
    const along = (Math.abs(c) === n ? c - Math.sign(c) : c) * sign;
    if (along <= limit) return st;
    let pos = st.pos;
    let normal = st.normal;
    for (let k = 0; k < t.amount; k++) {
      pos = rotate(pos, axis, sign);
      normal = rotate(normal, axis, sign);
    }
    return { ...st, pos, normal };
  });
}

export const isSolvedCube = (cube: Cube) => {
  const byFace = new Map<string, Face>();
  for (const st of cube) {
    const key = st.normal.join(',');
    const seen = byFace.get(key);
    if (seen === undefined) byFace.set(key, st.color);
    else if (seen !== st.color) return false;
  }
  return true;
};

export function moveName(t: Turn): string {
  const base = t.depth > 1 ? `${t.face}w` : t.face;
  return base + (t.amount === 2 ? '2' : t.amount === 3 ? "'" : '');
}

export function parseMove(s: string): Turn | null {
  const m = /^([UDLRFB])(w?)(2|'|)$/.exec(s);
  if (!m) return null;
  return {
    face: m[1] as Face,
    depth: m[2] ? 2 : 1,
    amount: m[3] === '2' ? 2 : m[3] === "'" ? 3 : 1,
  };
}

export const invert = (t: Turn): Turn => ({ ...t, amount: (4 - t.amount) as 1 | 2 | 3 });

/** All moves allowed on an N-cube: outer faces, plus wide moves from the 4×4 up. */
export function moveSet(n: number): Turn[] {
  const out: Turn[] = [];
  for (const face of FACES)
    for (let depth = 1; depth <= (n >= 4 ? 2 : 1); depth++)
      for (const amount of [1, 2, 3] as const) out.push({ face, depth, amount });
  return out;
}

const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };

/** A seeded random-move scramble that never turns the same face (or its opposite pair) pointlessly. */
export function scramble(n: number, seed: number, length: number): Turn[] {
  const rng = new Rng(seed >>> 0);
  const moves = moveSet(n);
  const out: Turn[] = [];
  while (out.length < length) {
    const t = moves[rng.int(moves.length)]!;
    const last = out[out.length - 1];
    const before = out[out.length - 2];
    if (last && last.face === t.face) continue;
    if (last && before && OPPOSITE[last.face] === t.face && before.face === t.face) continue;
    out.push(t);
  }
  return out;
}

/** Merges consecutive turns of the same face and depth, dropping full rotations. */
export function simplify(moves: readonly Turn[]): Turn[] {
  const out: Turn[] = [];
  for (const t of moves) {
    const last = out[out.length - 1];
    if (last && last.face === t.face && last.depth === t.depth) {
      const amount = (last.amount + t.amount) % 4;
      out.pop();
      if (amount) out.push({ ...t, amount: amount as 1 | 2 | 3 });
    } else out.push(t);
  }
  return out;
}

/** Undoing a sequence: its inverse, simplified. */
export const undoSequence = (moves: readonly Turn[]) => simplify([...moves].reverse().map(invert));
