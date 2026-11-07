// Offline generator for the Traffic Jam puzzle bank (src/games/traffic-jam/puzzles.ts): random
// layouts, the whole reachable position space explored with numeric keys, the position farthest
// from a free exit kept. Prints JSON with board strings and fewest-move counts.
// Usage: npx tsx tools/generate-traffic-jam.ts <level> <count> <seed> <min> <max> <vmin> <vmax>
import { Rng } from '../src/core/game-engine/random';
const S = 6,
  EXIT = 2;
interface V {
  line: number;
  h: boolean;
  len: number;
}
const cellsOf = (v: V, at: number) =>
  Array.from({ length: v.len }, (_, i) => (v.h ? v.line * S + at + i : (at + i) * S + v.line));
function layout(rng: Rng, count: number) {
  const vs: V[] = [{ line: EXIT, h: true, len: 2 }];
  const pos = [rng.int(S - 2)];
  const used = new Set(cellsOf(vs[0]!, pos[0]!));
  for (let t = 0; vs.length < count && t < 500; t++) {
    const h = rng.chance(0.5),
      len = rng.chance(0.28) ? 3 : 2,
      line = rng.int(S);
    if (h && line === EXIT) continue;
    const at = rng.int(S - len + 1);
    const v = { line, h, len };
    const cs = cellsOf(v, at);
    if (cs.some((c) => used.has(c))) continue;
    cs.forEach((c) => used.add(c));
    vs.push(v);
    pos.push(at);
  }
  return vs.length === count ? { vs, pos } : null;
}
function explore(vs: V[], start: number[], cap: number) {
  const n = vs.length;
  const pow = Array.from({ length: n }, (_, i) => 6 ** i);
  const enc = (p: number[]) => p.reduce((k, x, i) => k + x * pow[i]!, 0);
  const index = new Map<number, number>();
  const states: number[][] = [start];
  const edges: number[][] = [];
  index.set(enc(start), 0);
  const occ = new Int8Array(36);
  for (let s = 0; s < states.length; s++) {
    if (states.length > cap) return null;
    const p = states[s]!;
    occ.fill(-1);
    vs.forEach((v, i) => cellsOf(v, p[i]!).forEach((c) => (occ[c] = i)));
    const list: number[] = [];
    vs.forEach((v, i) => {
      const at = p[i]!;
      const cell = (k: number) => (v.h ? v.line * S + k : k * S + v.line);
      const push = (to: number) => {
        const q = [...p];
        q[i] = to;
        const k = enc(q);
        let j = index.get(k);
        if (j === undefined) {
          j = states.length;
          index.set(k, j);
          states.push(q);
        }
        list.push(j);
      };
      for (let k = at - 1; k >= 0 && occ[cell(k)] === -1; k--) push(k);
      for (let k = at + v.len; k < S && occ[cell(k)] === -1; k++) push(k - v.len + 1);
    });
    edges.push(list);
  }
  const dist = new Int32Array(states.length).fill(-1);
  let q = states.flatMap((p, i) => (p[0] === S - 2 ? [i] : []));
  if (!q.length) return null;
  for (const i of q) dist[i] = 0;
  for (let d = 1; q.length; d++) {
    const nx: number[] = [];
    for (const i of q)
      for (const j of edges[i]!)
        if (dist[j] === -1) {
          dist[j] = d;
          nx.push(j);
        }
    q = nx;
  }
  let far = 0;
  for (let i = 0; i < states.length; i++) if (dist[i]! > dist[far]!) far = i;
  return { start: states[far]!, moves: dist[far]!, size: states.length };
}
function board(vs: V[], p: number[]) {
  const g = Array(36).fill('o');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  vs.forEach((v, i) => cellsOf(v, p[i]!).forEach((c) => (g[c] = letters[i])));
  return g.join('');
}
const [level, wantArg, seedArg, minArg, maxArg, vminArg, vmaxArg] = process.argv.slice(2);
const want = Number(wantArg),
  min = Number(minArg),
  max = Number(maxArg),
  vmin = Number(vminArg),
  vmax = Number(vmaxArg);
const rng = new Rng(Number(seedArg));
const seen = new Set<string>();
const out: string[] = [];
const t0 = Date.now();
while (out.length < want && Date.now() - t0 < 25 * 60_000) {
  const l = layout(rng, vmin + rng.int(vmax - vmin + 1));
  if (!l) continue;
  const r = explore(l.vs, l.pos, 200_000);
  if (!r || r.moves < min || r.moves > max) continue;
  const b = board(l.vs, r.start);
  if (seen.has(b)) continue;
  seen.add(b);
  out.push(`${b}:${r.moves}`);
}
console.log(JSON.stringify({ level, count: out.length, ms: Date.now() - t0, puzzles: out }));
