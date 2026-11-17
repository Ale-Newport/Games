/**
 * Theme Strands search: every free path in the grid that spells a dictionary word (or an answer),
 * found by a depth-first search guided by a prefix trie. The word-finder agent submits the longest
 * words first — theme words are usually long — and takes hints when it can.
 */
import {
  COLS,
  ROWS,
  adjacent,
  answers,
  letterAt,
  puzzleById,
  usedCells,
  type StrandsState,
} from './engine';

interface Trie {
  end: boolean;
  next: Map<string, Trie>;
}

const tries = new WeakMap<Set<string>, Trie>();

function trieOf(words: Set<string>, extra: string[]): Trie {
  let t = tries.get(words);
  if (!t) {
    t = { end: false, next: new Map() };
    tries.set(words, t);
    for (const w of words) add(t, w);
  }
  for (const w of extra) add(t, w);
  return t;
}

function add(t: Trie, w: string) {
  let node = t;
  for (const ch of w) {
    let n = node.next.get(ch);
    if (!n) {
      n = { end: false, next: new Map() };
      node.next.set(ch, n);
    }
    node = n;
  }
  node.end = true;
}

/** Every legal path (4+ letters) through free cells that spells a word of the dictionary. */
export function findPaths(s: StrandsState, dict: Set<string>, maxLen = 12): number[][] {
  const p = puzzleById(s.puzzleId);
  const root = trieOf(dict, answers(p));
  const used = usedCells(s);
  const out: number[][] = [];
  const seen = new Set<string>();
  const rec = (path: number[], node: Trie) => {
    if (node.end && path.length >= 4) {
      const key = path.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        out.push([...path]);
      }
    }
    if (path.length >= maxLen) return;
    const last = path[path.length - 1]!;
    for (let c = 0; c < COLS * ROWS; c++) {
      if (used.has(c) || path.includes(c) || !adjacent(last, c)) continue;
      const n = node.next.get(letterAt(p, c));
      if (n) {
        path.push(c);
        rec(path, n);
        path.pop();
      }
    }
  };
  for (let c = 0; c < COLS * ROWS; c++) {
    if (used.has(c)) continue;
    const n = root.next.get(letterAt(p, c));
    if (n) rec([c], n);
  }
  return out;
}

export function wordOf(s: StrandsState, path: readonly number[]): string {
  const p = puzzleById(s.puzzleId);
  return path.map((c) => letterAt(p, c)).join('');
}
