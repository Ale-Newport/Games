// Offline generator for the Sokoban level bank (src/games/sokoban/levels.ts): a random room, boxes
// placed on goals, then the whole space of positions reachable by pulling boxes (the reverse of
// pushing) explored; the position farthest from solved (in pushes) becomes the level. Prints JSON
// with levels in the usual text notation.
// Usage: npx tsx tools/generate-sokoban.ts <count> <seed> <boxes> <minPushes> <width> <height> [maxStates]
import { Rng } from '../src/core/game-engine/random';

const [countArg, seedArg, boxesArg, minArg, wArg, hArg, maxStatesArg] = process.argv.slice(2);
const want = Number(countArg),
  boxes = Number(boxesArg),
  minPushes = Number(minArg);
const W = Number(wArg),
  H = Number(hArg),
  MAX_STATES = Number(maxStatesArg ?? 400000);
const rng = new Rng(Number(seedArg));

function room(): boolean[] | null {
  // floor[c] true for floor. Border is wall. Carve with random 3x3 templates of walls.
  const floor = Array.from({ length: W * H }, (_, c) => {
    const x = c % W,
      y = Math.floor(c / W);
    return x > 0 && y > 0 && x < W - 1 && y < H - 1;
  });
  const blocks = 2 + rng.int(4);
  for (let b = 0; b < blocks; b++) {
    const x = 1 + rng.int(W - 2),
      y = 1 + rng.int(H - 2);
    const shape = rng.int(4);
    const cells =
      shape === 0
        ? [[0, 0]]
        : shape === 1
          ? [
              [0, 0],
              [1, 0],
            ]
          : shape === 2
            ? [
                [0, 0],
                [0, 1],
              ]
            : [
                [0, 0],
                [1, 0],
                [0, 1],
              ];
    for (const [dx, dy] of cells) {
      const xx = x + dx!,
        yy = y + dy!;
      if (xx > 0 && yy > 0 && xx < W - 1 && yy < H - 1) floor[yy * W + xx] = false;
    }
  }
  // Connected floor, and no floor cell in a dead pocket of width 1 at both ends is fine.
  const cells = floor.flatMap((f, c) => (f ? [c] : []));
  if (cells.length < 12) return null;
  const seen = new Set([cells[0]!]);
  const st = [cells[0]!];
  while (st.length) {
    const c = st.pop()!;
    for (const d of [1, -1, W, -W]) {
      const x = c + d;
      if (floor[x] && !seen.has(x)) {
        seen.add(x);
        st.push(x);
      }
    }
  }
  return seen.size === cells.length ? floor : null;
}

function regionMin(floor: boolean[], boxSet: Set<number>, start: number): number {
  let min = start;
  const seen = new Set([start]);
  const st = [start];
  while (st.length) {
    const c = st.pop()!;
    if (c < min) min = c;
    for (const d of [1, -1, W, -W]) {
      const x = c + d;
      if (floor[x] && !boxSet.has(x) && !seen.has(x)) {
        seen.add(x);
        st.push(x);
      }
    }
  }
  return min;
}
function reach(floor: boolean[], boxSet: Set<number>, start: number): Set<number> {
  const seen = new Set([start]);
  const st = [start];
  while (st.length) {
    const c = st.pop()!;
    for (const d of [1, -1, W, -W]) {
      const x = c + d;
      if (floor[x] && !boxSet.has(x) && !seen.has(x)) {
        seen.add(x);
        st.push(x);
      }
    }
  }
  return seen;
}

function generate() {
  const floor = room();
  if (!floor) return null;
  const cells = floor.flatMap((f, c) => (f ? [c] : []));
  // Goals: avoid cells with two adjacent walls in a corner? goals may be anywhere.
  const goals: number[] = [];
  while (goals.length < boxes) {
    const c = cells[rng.int(cells.length)]!;
    if (!goals.includes(c)) goals.push(c);
  }
  // Reverse BFS over (boxes, player region) by pulls. Start: boxes on goals, player in each region.
  const key = (bx: number[], p: number) => bx.join(',') + '|' + p;
  const startBoxes = [...goals].sort((a, b) => a - b);
  const bset = new Set(startBoxes);
  const regions = new Set<number>();
  for (const c of cells) if (!bset.has(c)) regions.add(regionMin(floor, bset, c));
  const dist = new Map<string, number>();
  let frontier: { bx: number[]; p: number }[] = [];
  for (const p of regions) {
    const k = key(startBoxes, p);
    dist.set(k, 0);
    frontier.push({ bx: startBoxes, p });
  }
  let far = frontier[0]!;
  let farD = 0;
  for (let d = 1; frontier.length; d++) {
    const next: typeof frontier = [];
    for (const { bx, p } of frontier) {
      const set = new Set(bx);
      const area = reach(floor, set, p);
      bx.forEach((b, i) => {
        for (const dir of [1, -1, W, -W]) {
          // Pull: player at b+dir moves to b+2dir, box moves from b to b+dir.
          const pc = b + dir,
            back = b + 2 * dir;
          if (!area.has(pc) || !floor[back] || set.has(back)) continue;
          const nb = [...bx];
          nb[i] = pc;
          nb.sort((a, c) => a - c);
          const nset = new Set(nb);
          const np = regionMin(floor, nset, back);
          const k = key(nb, np);
          if (dist.has(k)) continue;
          dist.set(k, d);
          next.push({ bx: nb, p: np });
          if (d > farD) {
            farD = d;
            far = { bx: nb, p: back };
          }
        }
      });
      if (dist.size > MAX_STATES) return null;
    }
    frontier = next;
  }
  if (farD < minPushes) return null;
  // Quality: no box starts on a goal.
  if (far.bx.some((b) => goals.includes(b))) return null;
  const rows: string[] = [];
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < W; x++) {
      const c = y * W + x;
      const g = goals.includes(c),
        b = far.bx.includes(c),
        pl = far.p === c;
      r += !floor[c] ? '#' : b ? (g ? '*' : '$') : pl ? (g ? '+' : '@') : g ? '.' : ' ';
    }
    rows.push(r);
  }
  return { level: rows.join('|'), pushes: farD, states: dist.size };
}

const out: string[] = [];
const seen = new Set<string>();
const t0 = Date.now();
while (out.length < want && Date.now() - t0 < 20 * 60_000) {
  const g = generate();
  if (!g || seen.has(g.level)) continue;
  seen.add(g.level);
  out.push(`${g.level}:${g.pushes}`);
}
console.log(JSON.stringify({ count: out.length, ms: Date.now() - t0, levels: out }));
