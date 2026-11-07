/**
 * Optimal 2×2 solver. The cube is read as eight corner cubies (permutation and twist), turned as a
 * whole so that the down-back-left corner sits home, and solved with iterative deepening over the
 * nine U/R/F turns, guided by exact distance tables for the permutation alone (5 040 states) and the
 * twist alone (729 states). Solutions are in the face turn metric and optimal.
 */
import { FACES, turn, type Cube, type Face, type Turn } from './cube';

/** Corner positions with their facelets in reference order (U/D facelet first, then clockwise). */
const CORNERS: [Face, Face, Face][] = [
  ['U', 'R', 'F'],
  ['U', 'F', 'L'],
  ['U', 'L', 'B'],
  ['U', 'B', 'R'],
  ['D', 'F', 'R'],
  ['D', 'L', 'F'],
  ['D', 'B', 'L'],
  ['D', 'R', 'B'],
];
const DBL = 6;

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

/** Corner cubie moves (Kociemba's tables): which position each comes from, and the twist added. */
const MOVES: Record<'U' | 'R' | 'F', { cp: number[]; co: number[] }> = {
  U: { cp: [3, 0, 1, 2, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0] },
  R: { cp: [4, 1, 2, 0, 7, 5, 6, 3], co: [2, 0, 0, 1, 1, 0, 0, 2] },
  F: { cp: [1, 5, 2, 3, 0, 4, 6, 7], co: [1, 2, 0, 0, 2, 1, 0, 0] },
};

interface Corners {
  cp: number[];
  co: number[];
}

function apply(c: Corners, m: { cp: number[]; co: number[] }): Corners {
  return {
    cp: m.cp.map((from) => c.cp[from]!),
    co: m.cp.map((from, i) => (c.co[from]! + m.co[i]!) % 3),
  };
}

/** Reads corner cubies from stickers (cube already turned so that DBL is home). */
export function readCorners(cube: Cube): Corners | null {
  const at = new Map<string, Face>();
  for (const st of cube) at.set(`${st.pos.join(',')}|${faceOf(st.normal)}`, st.color);
  const cp: number[] = [];
  const co: number[] = [];
  for (const facelets of CORNERS) {
    // The cubie's centre (±1 on each axis); a sticker sits on the face plane (±2) of its facelet.
    const pos = [0, 0, 0];
    for (const f of facelets) pos[AXIS[f][0]] = AXIS[f][1];
    const colors = facelets.map((f) => {
      const p = [...pos];
      p[AXIS[f][0]] = AXIS[f][1] * 2;
      return at.get(`${p.join(',')}|${f}`);
    });
    if (colors.some((c) => c === undefined)) return null;
    const set = [...colors].sort().join('');
    const piece = CORNERS.findIndex((c) => [...c].sort().join('') === set);
    const twist = colors.findIndex((c) => c === 'U' || c === 'D');
    if (piece < 0 || twist < 0) return null;
    cp.push(piece);
    co.push(twist);
  }
  return { cp, co };
}

/** Whole-cube rotations, each as turns of every layer (depth 2 on a 2×2). */
const ROTATIONS: Turn[][] = (() => {
  const x: Turn = { face: 'R', depth: 2, amount: 1 };
  const y: Turn = { face: 'U', depth: 2, amount: 1 };
  const out: Turn[][] = [];
  const ups: Turn[][] = [
    [],
    [x],
    [x, x],
    [x, x, x],
    [{ face: 'F', depth: 2, amount: 1 }],
    [{ face: 'F', depth: 2, amount: 3 }],
  ];
  for (const up of ups)
    for (let k = 0; k < 4; k++) out.push([...up, ...Array.from({ length: k }, () => y)]);
  return out;
})();

/** The rotation bringing the D/B/L corner home with its D sticker down, and the corners read then. */
export function normalize(cube: Cube): { rotation: Turn[]; corners: Corners } | null {
  for (const rotation of ROTATIONS) {
    let c = cube;
    for (const t of rotation) c = turn(c, 2, t);
    const corners = readCorners(c);
    if (corners && corners.cp[DBL] === DBL && corners.co[DBL] === 0) return { rotation, corners };
  }
  return null;
}

const permIndex = (cp: readonly number[]) => {
  // Lehmer code over the seven moving corners (DBL stays home).
  const p = [0, 1, 2, 3, 4, 5, 7].map((i) => cp[i]!);
  let k = 0;
  for (let i = 0; i < 7; i++) {
    let smaller = 0;
    for (let j = i + 1; j < 7; j++) if (p[j]! < p[i]!) smaller++;
    k = k * (7 - i) + smaller;
  }
  return k;
};
const twistIndex = (co: readonly number[]) => co.slice(0, 6).reduce((k, x) => k * 3 + x, 0);

let tables: { perm: Uint8Array; twist: Uint8Array } | null = null;
function distanceTables() {
  if (tables) return tables;
  const perm = new Uint8Array(5040).fill(255);
  const twist = new Uint8Array(729).fill(255);
  const solved: Corners = { cp: [0, 1, 2, 3, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0] };
  for (const [table, index] of [
    [perm, (c: Corners) => permIndex(c.cp)],
    [twist, (c: Corners) => twistIndex(c.co)],
  ] as const) {
    table[index(solved)] = 0;
    let frontier = [solved];
    for (let d = 1; frontier.length; d++) {
      const next: Corners[] = [];
      for (const c of frontier)
        for (const m of Object.values(MOVES)) {
          let x = c;
          for (let k = 0; k < 3; k++) {
            x = apply(x, m);
            const i = index(x);
            if (table[i] === 255) {
              table[i] = d;
              next.push(x);
            }
          }
        }
      frontier = next;
    }
  }
  tables = { perm, twist };
  return tables;
}

/** An optimal solution (face turns) for corners already normalized. */
export function solveCorners(start: Corners): Turn[] {
  const { perm, twist } = distanceTables();
  const h = (c: Corners) => Math.max(perm[permIndex(c.cp)]!, twist[twistIndex(c.co)]!);
  const path: Turn[] = [];
  const faces = ['U', 'R', 'F'] as const;
  const search = (c: Corners, g: number, bound: number, last: string): boolean => {
    const est = h(c);
    if (est === 0) return true;
    if (g + est > bound) return false;
    for (const f of faces) {
      if (f === last) continue;
      let x = c;
      for (let amount = 1; amount <= 3; amount++) {
        x = apply(x, MOVES[f]);
        path.push({ face: f, depth: 1, amount: amount as 1 | 2 | 3 });
        if (search(x, g + 1, bound, f)) return true;
        path.pop();
      }
    }
    return false;
  };
  for (let bound = h(start); bound <= 14; bound++)
    if (search(start, 0, bound, '')) return [...path];
  return [];
}

/** Maps a turn made in the rotated frame back to the player's frame. */
function unrotate(t: Turn, rotation: Turn[]): Turn {
  // Track the face's normal backwards through the rotation (inverse turns in reverse order).
  let normal = [0, 0, 0];
  normal[AXIS[t.face][0]] = AXIS[t.face][1];
  for (const r of [...rotation].reverse()) {
    const probe = turn(
      [
        {
          pos: [normal[0]! * 2, normal[1]! * 2, normal[2]! * 2],
          normal: normal as [number, number, number],
          color: 'U',
        },
      ],
      2,
      { ...r, amount: (4 - r.amount) as 1 | 2 | 3 },
    )[0]!;
    normal = probe.normal;
  }
  return { ...t, face: faceOf(normal) };
}

/** The fewest face turns that solve a 2×2, in the player's frame (empty when solved). */
export function solvePocket(cube: Cube): Turn[] | null {
  const norm = normalize(cube);
  if (!norm) return null;
  return solveCorners(norm.corners).map((t) => unrotate(t, norm.rotation));
}
