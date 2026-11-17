/**
 * Word vectors for the semantic word games (#206 Word Rank, #207 Word Warmth, #215 Code Words):
 * 30,000 frequent English words with 160-dimensional vectors derived from GloVe 6B (public
 * domain dedication and license) by `training/scripts/build_semantic.py`. Vectors are int8 and
 * L2-normalized before quantization, so a dot product divided by 127² is the cosine similarity.
 */
export interface Vectors {
  words: string[];
  index: Map<string, number>;
  dims: number;
  data: Int8Array;
}

/** Cosine similarity between two words' rows. */
export function similarity(v: Vectors, a: number, b: number): number {
  const d = v.dims;
  let s = 0;
  const oa = a * d;
  const ob = b * d;
  for (let k = 0; k < d; k++) s += v.data[oa + k]! * v.data[ob + k]!;
  return s / (127 * 127);
}

/** All similarities to one word (Float32Array indexed by word row). */
export function similaritiesTo(v: Vectors, target: number): Float32Array {
  const n = v.words.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = similarity(v, target, i);
  return out;
}

const neighbourCache = new WeakMap<Vectors, Map<number, number[]>>();

/** The 60 nearest words to a word (excluding itself), by vector similarity; cached. */
export function neighbours(v: Vectors, word: number): number[] {
  let byWord = neighbourCache.get(v);
  if (!byWord) {
    byWord = new Map();
    neighbourCache.set(v, byWord);
  }
  let n = byWord.get(word);
  if (!n) {
    const sims = similaritiesTo(v, word);
    n = Array.from({ length: v.words.length }, (_, i) => i)
      .filter((i) => i !== word)
      .sort((a, b) => sims[b]! - sims[a]!)
      .slice(0, 60);
    byWord.set(word, n);
  }
  return n;
}

/** Ranks every word by closeness to the target: rank[target] = 1, the next closest 2, … */
export function rankAll(v: Vectors, target: number): Int32Array {
  const sims = similaritiesTo(v, target);
  const order = Array.from({ length: v.words.length }, (_, i) => i).sort(
    (a, b) => sims[b]! - sims[a]! || a - b,
  );
  const rank = new Int32Array(v.words.length);
  order.forEach((w, i) => (rank[w] = i + 1));
  rank[target] = 1;
  return rank;
}

/** Normalizes a guess and folds simple plurals onto a known singular. */
export function lookup(v: Vectors, raw: string): number | null {
  const w = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  if (!/^[a-z]{2,}$/.test(w)) return null;
  const direct = v.index.get(w);
  if (direct !== undefined) return direct;
  const tries = [
    w.endsWith('ies') ? `${w.slice(0, -3)}y` : null,
    /(ch|sh|x|s|z)es$/.test(w) ? w.slice(0, -2) : null,
    w.endsWith('s') ? w.slice(0, -1) : null,
  ];
  for (const t of tries) if (t && v.index.has(t)) return v.index.get(t)!;
  return null;
}

/** Builds vectors from the raw files (used by the loader and by tests in Node). */
export function parseVectors(wordsText: string, bytes: ArrayBuffer): Vectors {
  const words = wordsText.split('\n').filter(Boolean);
  const data = new Int8Array(bytes);
  const dims = data.length / words.length;
  if (!Number.isInteger(dims)) throw new Error('Vector file does not match the word list');
  return { words, index: new Map(words.map((w, i) => [w, i])), dims, data };
}

let loading: Promise<Vectors> | null = null;

/** The few Node APIs used to read the files from disk in tests and tools. */
interface NodeHost {
  process?: { versions?: { node?: string }; cwd(): string };
}
interface NodeFs {
  readFile(path: string | URL, encoding: 'utf8'): Promise<string>;
  readFile(path: string | URL): Promise<Uint8Array>;
}

const host = globalThis as unknown as NodeHost;

/** Loads the vectors once (about 5 MB, fetched on first use; read from disk under Node). */
export function loadVectors(): Promise<Vectors> {
  loading ??= (async () => {
    const proc = host.process;
    if (proc?.versions?.node) {
      const fsName = 'node:fs/promises';
      const fs = (await import(/* @vite-ignore */ fsName)) as NodeFs;
      // Under jsdom test runs the module URL is http(s); resolve its path from the project root.
      const at = (name: string) => {
        const u = new URL(name, import.meta.url);
        return u.protocol === 'file:' ? u : `${proc.cwd()}${decodeURIComponent(u.pathname)}`;
      };
      const [text, bin] = await Promise.all([
        fs.readFile(at('./words.txt'), 'utf8'),
        fs.readFile(at('./vectors.bin')),
      ]);
      return parseVectors(
        text,
        bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength) as ArrayBuffer,
      );
    }
    const [wordsUrl, binUrl] = await Promise.all([
      import('./words.txt?url').then((m) => m.default),
      import('./vectors.bin?url').then((m) => m.default),
    ]);
    const [text, bin] = await Promise.all([
      fetch(wordsUrl).then((r) => r.text()),
      fetch(binUrl).then((r) => r.arrayBuffer()),
    ]);
    return parseVectors(text, bin);
  })();
  return loading;
}
