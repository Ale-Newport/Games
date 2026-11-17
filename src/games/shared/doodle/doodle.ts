/**
 * Doodle recognition shared by #213 Sketch & Guess, #214 Draw Telephone and #227 Doodle
 * Recognizer: strokes are rasterized to 28×28 exactly as in training
 * (`training/scripts/build_doodles.py`) and fed to a small multilayer perceptron (784-256-128-N,
 * int8 weights) trained on human doodles from the Quick Draw dataset (Google, CC BY 4.0).
 */
import meta from './model.json';

export type Stroke = [number[], number[]];
export interface Guess {
  label: string;
  p: number;
}

export const CLASSES: readonly string[] = meta.classes;
const SIZE = meta.size;
const WIDTH = meta.width;

function normalize(strokes: readonly Stroke[]): Stroke[] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [xs, ys] of strokes) {
    for (const x of xs) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
    }
    for (const y of ys) {
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  const span = Math.max(x1 - x0, y1 - y0, 1);
  const ox = (span - (x1 - x0)) / 2;
  const oy = (span - (y1 - y0)) / 2;
  return strokes.map(([xs, ys]) => [
    xs.map((x) => (x - x0 + ox) / span),
    ys.map((y) => (y - y0 + oy) / span),
  ]);
}

/** 28×28 grayscale (row-major, 0–1), anti-aliased lines of fixed width; matches the trainer. */
export function rasterize(strokes: readonly Stroke[]): Float32Array {
  const img = new Float32Array(SIZE * SIZE);
  if (!strokes.length || !strokes.some((s) => s[0].length)) return img;
  const scale = SIZE - 4;
  for (const [nx, ny] of normalize(strokes.filter((s) => s[0].length))) {
    let X = nx.map((x) => x * scale + 2);
    let Y = ny.map((y) => y * scale + 2);
    if (X.length === 1) {
      X = [X[0]!, X[0]!];
      Y = [Y[0]!, Y[0]!];
    }
    for (let i = 0; i < X.length - 1; i++) {
      const ax = X[i]!;
      const ay = Y[i]!;
      const dx = X[i + 1]! - ax;
      const dy = Y[i + 1]! - ay;
      const l2 = dx * dx + dy * dy;
      const minX = Math.max(0, Math.floor(Math.min(ax, ax + dx) - 2));
      const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(ax, ax + dx) + 2));
      const minY = Math.max(0, Math.floor(Math.min(ay, ay + dy) - 2));
      const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(ay, ay + dy) + 2));
      for (let py = minY; py <= maxY; py++)
        for (let px = minX; px <= maxX; px++) {
          const gx = px + 0.5;
          const gy = py + 0.5;
          const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((gx - ax) * dx + (gy - ay) * dy) / l2));
          const d = Math.hypot(gx - (ax + t * dx), gy - (ay + t * dy));
          const v = Math.max(0, Math.min(1, 1 - (d - WIDTH / 2)));
          const k = py * SIZE + px;
          if (v > img[k]!) img[k] = v;
        }
    }
  }
  return img;
}

interface Layer {
  inputs: number;
  outputs: number;
  w: Int8Array;
  scale: Float32Array;
  bias: Float32Array;
}

export interface Model {
  layers: Layer[];
}

export function parseModel(buf: ArrayBuffer): Model {
  const layers: Layer[] = [];
  let off = 0;
  for (const { inputs, outputs } of meta.layers) {
    const w = new Int8Array(buf, off, inputs * outputs);
    off += inputs * outputs;
    const scale = new Float32Array(buf.slice(off, off + outputs * 4));
    off += outputs * 4;
    const bias = new Float32Array(buf.slice(off, off + outputs * 4));
    off += outputs * 4;
    layers.push({ inputs, outputs, w, scale, bias });
  }
  return { layers };
}

/** Class probabilities, most likely first. */
export function classify(model: Model, strokes: readonly Stroke[], top = 5): Guess[] {
  let x: Float32Array = rasterize(strokes);
  model.layers.forEach((L, li) => {
    const y = new Float32Array(L.outputs);
    for (let o = 0; o < L.outputs; o++) {
      let s = 0;
      for (let i = 0; i < L.inputs; i++) s += x[i]! * L.w[i * L.outputs + o]!;
      const v = s * L.scale[o]! + L.bias[o]!;
      y[o] = li < model.layers.length - 1 ? Math.max(0, v) : v;
    }
    x = y;
  });
  const m = Math.max(...x);
  const e = Array.from(x, (v) => Math.exp(v - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e
    .map((v, i) => ({ label: CLASSES[i]!, p: v / z }))
    .sort((a, b) => b.p - a.p)
    .slice(0, top);
}

const host = globalThis as unknown as { process?: { versions?: { node?: string }; cwd(): string } };
interface NodeFs {
  readFile(path: string | URL): Promise<Uint8Array>;
  readFile(path: string | URL, encoding: 'utf8'): Promise<string>;
}

async function readAsset(name: 'model.bin' | 'doodles.json'): Promise<ArrayBuffer | string> {
  const proc = host.process;
  if (proc?.versions?.node) {
    const fsName = 'node:fs/promises';
    const fs = (await import(/* @vite-ignore */ fsName)) as NodeFs;
    // Literal paths: a template here would make Vite glob the whole folder.
    const u =
      name === 'model.bin'
        ? new URL('./model.bin', import.meta.url)
        : new URL('./doodles.json', import.meta.url);
    const at = u.protocol === 'file:' ? u : `${proc.cwd()}${decodeURIComponent(u.pathname)}`;
    if (name === 'doodles.json') return fs.readFile(at, 'utf8');
    const b = await fs.readFile(at);
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  }
  const url =
    name === 'model.bin'
      ? (await import('./model.bin?url')).default
      : (await import('./doodles.json?url')).default;
  const r = await fetch(url);
  return name === 'model.bin' ? r.arrayBuffer() : r.text();
}

let modelP: Promise<Model> | null = null;
export function loadModel(): Promise<Model> {
  modelP ??= readAsset('model.bin').then((b) => parseModel(b as ArrayBuffer));
  return modelP;
}

let doodlesP: Promise<Record<string, Stroke[][]>> | null = null;
/** Real human doodles (Quick Draw, CC BY 4.0) per class, for bots to draw. */
export function loadDoodles(): Promise<Record<string, Stroke[][]>> {
  doodlesP ??= readAsset('doodles.json').then(
    (t) => JSON.parse(t as string) as Record<string, Stroke[][]>,
  );
  return doodlesP;
}
