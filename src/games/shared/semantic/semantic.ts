/**
 * Word vectors for the semantic word games (#206 Word Rank, #207 Word Warmth, #215 Code Words):
 * 30,000 frequent English words with 160-dimensional vectors derived from GloVe 6B (public
 * domain dedication and license) by `training/scripts/build_semantic.py`. Vectors are int8 and
 * L2-normalized before quantization, so a dot product divided by 127² is the cosine similarity.
 *
 * Spanish (`lang: 'es'`): 30,000 frequent Spanish words derived from the fastText Common Crawl
 * vectors (Grave et al. 2018, CC BY-SA 3.0) by `training/scripts/build_semantic_es.py`, in the
 * same format (`words-es.txt`, `vectors-es.bin`). Words keep their accents; guesses may omit them.
 */
import { fetchChecked, memoizeUntilFailure } from '../../../core/assets/load';

/** Languages with a vector table. */
export type SemanticLang = 'en' | 'es';

/** The vector language for a UI locale. */
export const semanticLang = (locale: string): SemanticLang => (locale === 'es' ? 'es' : 'en');

export interface Vectors {
  lang: SemanticLang;
  words: string[];
  /** Exact spellings and accent-free spellings → row. */
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

/**
 * Lower case without accents. Spanish keeps ñ, a letter of its own (año ≠ ano); English folds
 * every diacritic as before.
 */
export function fold(raw: string, lang: SemanticLang = 'en'): string {
  const w = raw.trim().toLowerCase();
  if (lang === 'es')
    return w
      .replace(/ñ/g, '\0')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\0/g, 'ñ');
  return w.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Singular candidates for a folded plural, most specific first. */
function singulars(w: string, lang: SemanticLang): (string | null)[] {
  if (lang === 'es')
    return [
      w.endsWith('ces') ? `${w.slice(0, -3)}z` : null, // luces → luz
      w.endsWith('es') ? w.slice(0, -2) : null, // árboles → arbol, canciones → cancion
      w.endsWith('s') ? w.slice(0, -1) : null, // casas → casa
    ];
  return [
    w.endsWith('ies') ? `${w.slice(0, -3)}y` : null,
    /(ch|sh|x|s|z)es$/.test(w) ? w.slice(0, -2) : null,
    w.endsWith('s') ? w.slice(0, -1) : null,
  ];
}

/** Normalizes a guess (case, accents) and folds simple plurals onto a known singular. */
export function lookup(v: Vectors, raw: string): number | null {
  const w = fold(raw, v.lang);
  if (!(v.lang === 'es' ? /^[a-zñ]{2,}$/ : /^[a-z]{2,}$/).test(w)) return null;
  const direct = v.index.get(w);
  if (direct !== undefined) return direct;
  for (const t of singulars(w, v.lang)) if (t && v.index.has(t)) return v.index.get(t)!;
  return null;
}

/** Builds vectors from the raw files (used by the loader and by tests in Node). */
export function parseVectors(
  wordsText: string,
  bytes: ArrayBuffer,
  lang: SemanticLang = 'en',
): Vectors {
  const words = wordsText.split('\n').filter(Boolean);
  const data = new Int8Array(bytes);
  const dims = data.length / words.length;
  if (!Number.isInteger(dims)) throw new Error('Vector file does not match the word list');
  const index = new Map(words.map((w, i) => [w, i]));
  // Accent-free spellings resolve too ("arbol" → "árbol"); the build keeps them unambiguous.
  words.forEach((w, i) => {
    const k = fold(w, lang);
    if (!index.has(k)) index.set(k, i);
  });
  return { lang, words, index, dims, data };
}

/** The few Node APIs used to read the files from disk in tests and tools. */
interface NodeHost {
  process?: { versions?: { node?: string }; cwd(): string };
}
interface NodeFs {
  readFile(path: string | URL, encoding: 'utf8'): Promise<string>;
  readFile(path: string | URL): Promise<Uint8Array>;
}

const host = globalThis as unknown as NodeHost;

/** Under Node (tests, tools) the files are read from disk instead of fetched. */
async function readFromDisk(url: URL): Promise<{ text?: string; bytes?: ArrayBuffer } | null> {
  const proc = host.process;
  if (!proc?.versions?.node) return null;
  const fsName = 'node:fs/promises';
  const fs = (await import(/* @vite-ignore */ fsName)) as NodeFs;
  // Under jsdom test runs the module URL is http(s); resolve its path from the project root.
  const at = url.protocol === 'file:' ? url : `${proc.cwd()}${decodeURIComponent(url.pathname)}`;
  if (url.pathname.endsWith('.txt')) return { text: await fs.readFile(at, 'utf8') };
  const b = await fs.readFile(at);
  return { bytes: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer };
}

// Literal paths only: Vite bundles exactly these files (a template would glob the folder).
const FILES: Record<
  SemanticLang,
  {
    words: () => URL;
    vectors: () => URL;
    wordsUrl: () => Promise<string>;
    vectorsUrl: () => Promise<string>;
  }
> = {
  en: {
    words: () => new URL('./words.txt', import.meta.url),
    vectors: () => new URL('./vectors.bin', import.meta.url),
    wordsUrl: () => import('./words.txt?url').then((m) => m.default),
    vectorsUrl: () => import('./vectors.bin?url').then((m) => m.default),
  },
  es: {
    words: () => new URL('./words-es.txt', import.meta.url),
    vectors: () => new URL('./vectors-es.bin', import.meta.url),
    wordsUrl: () => import('./words-es.txt?url').then((m) => m.default),
    vectorsUrl: () => import('./vectors-es.bin?url').then((m) => m.default),
  },
};

async function readWords(lang: SemanticLang): Promise<string> {
  const disk = await readFromDisk(FILES[lang].words());
  if (disk?.text !== undefined) return disk.text;
  return (await fetchChecked(await FILES[lang].wordsUrl())).text();
}

async function readVectors(lang: SemanticLang): Promise<ArrayBuffer> {
  const disk = await readFromDisk(FILES[lang].vectors());
  if (disk?.bytes !== undefined) return disk.bytes;
  return (await fetchChecked(await FILES[lang].vectorsUrl())).arrayBuffer();
}

const wordListLoaders = {
  en: memoizeUntilFailure(async () => (await readWords('en')).split('\n').filter(Boolean)),
  es: memoizeUntilFailure(async () => (await readWords('es')).split('\n').filter(Boolean)),
};

/** Loads only the 30,000-word list (about 240 kB), without the vectors. */
export function loadWordList(lang: SemanticLang = 'en'): Promise<string[]> {
  return wordListLoaders[lang]();
}

const vectorLoaders = {
  en: memoizeUntilFailure(async () => {
    const [text, bin] = await Promise.all([readWords('en'), readVectors('en')]);
    return parseVectors(text, bin, 'en');
  }),
  es: memoizeUntilFailure(async () => {
    const [text, bin] = await Promise.all([readWords('es'), readVectors('es')]);
    return parseVectors(text, bin, 'es');
  }),
};

/**
 * Loads a language's vectors once (about 5 MB, fetched on first use; read from disk under Node).
 * A failed download is not cached: the next call tries again.
 */
export function loadVectors(lang: SemanticLang = 'en'): Promise<Vectors> {
  return vectorLoaders[lang]();
}
