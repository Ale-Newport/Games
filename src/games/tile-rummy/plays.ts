/**
 * Finding plays from a rack: new sets made of rack tiles (the best disjoint choice, by value for a
 * first play and by tiles placed afterwards), then rack tiles added to the ends of table runs, to
 * groups of three, or into the middle of a long run (splitting it in two). This is the move
 * generator the computer players and the hints use; a human may rearrange the table more freely.
 */
import { colourOf, isJoker, numberOf, readSet, setValue, INITIAL_MELD } from './sets';

/** Every valid set that can be formed from these tiles (one copy of each number per run). */
export function setsFrom(tiles: readonly number[]): number[][] {
  const jokers = tiles.filter(isJoker);
  const plain = tiles.filter((t) => !isJoker(t));
  const out: number[][] = [];
  // Groups: one tile per colour of a number, topped up with jokers.
  for (let n = 1; n <= 13; n++) {
    const byColour = new Map<number, number>();
    for (const t of plain)
      if (numberOf(t) === n && !byColour.has(colourOf(t))) byColour.set(colourOf(t), t);
    const pool = [...byColour.values()];
    const subsets = (k: number): number[][] =>
      k === 0
        ? [[]]
        : pool.flatMap((t, i) =>
            subsets(k - 1)
              .filter((s) => s.every((x) => pool.indexOf(x) > i))
              .map((s) => [t, ...s]),
          );
    for (let size = 3; size <= 4; size++)
      for (let j = 0; j <= Math.min(jokers.length, size - 1); j++)
        for (const s of subsets(size - j)) if (s.length) out.push([...s, ...jokers.slice(0, j)]);
  }
  // Runs: a stretch of one colour, gaps filled with jokers.
  for (let c = 0; c < 4; c++) {
    const at = new Map<number, number>();
    for (const t of plain) if (colourOf(t) === c && !at.has(numberOf(t))) at.set(numberOf(t), t);
    for (let lo = 1; lo <= 11; lo++)
      for (let hi = lo + 2; hi <= 13; hi++) {
        const present = [];
        for (let n = lo; n <= hi; n++) if (at.has(n)) present.push(at.get(n)!);
        const missing = hi - lo + 1 - present.length;
        if (!present.length || missing > jokers.length || !at.has(lo) || !at.has(hi)) continue;
        out.push([...present, ...jokers.slice(0, missing)]);
      }
  }
  return out.filter((s) => readSet(s) !== null);
}

/** The best set of disjoint sets: most value (first play) or most tiles (later), searched with a cap. */
export function bestSets(tiles: readonly number[], byValue: boolean, cap = 20000): number[][] {
  const sets = setsFrom(tiles).sort((a, b) => setValue(b) - setValue(a) || b.length - a.length);
  let best: number[][] = [];
  let bestScore = 0;
  let nodes = 0;
  const score = (chosen: number[][]) =>
    chosen.reduce((a, s) => a + (byValue ? setValue(s) : s.length * 100 + setValue(s) / 100), 0);
  const rec = (from: number, used: Set<number>, chosen: number[][]) => {
    if (++nodes > cap) return;
    const s = score(chosen);
    if (s > bestScore) {
      bestScore = s;
      best = [...chosen];
    }
    for (let i = from; i < sets.length; i++) {
      const set = sets[i]!;
      if (set.some((t) => used.has(t))) continue;
      for (const t of set) used.add(t);
      chosen.push(set);
      rec(i + 1, used, chosen);
      chosen.pop();
      for (const t of set) used.delete(t);
    }
  };
  rec(0, new Set(), []);
  return best;
}

/** Adds rack tiles to the table where they fit (ends of runs, groups of three, splits of long runs). */
export function extend(table: number[][], rack: number[]): { table: number[][]; left: number[] } {
  const sets = table.map((s) => [...s]);
  let left = [...rack];
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of [...left]) {
      let placed = false;
      for (const s of sets) {
        if (readSet([...s, t])) {
          s.push(t);
          placed = true;
          break;
        }
      }
      if (!placed && !isJoker(t)) {
        // Into the middle of a run of five or more: split it at the tile's number.
        for (let i = 0; i < sets.length && !placed; i++) {
          const s = sets[i]!;
          const read = readSet(s);
          if (!read || read.kind !== 'run' || s.some(isJoker) || colourOf(s[0]!) !== colourOf(t))
            continue;
          const n = numberOf(t);
          const lo = Math.min(...s.map(numberOf));
          const hi = Math.max(...s.map(numberOf));
          if (n - lo >= 2 && hi - n >= 2) {
            sets[i] = s.filter((x) => numberOf(x) <= n);
            sets.push([...s.filter((x) => numberOf(x) > n), t]);
            placed = true;
          }
        }
      }
      if (placed) {
        left = left.filter((x) => x !== t);
        changed = true;
      }
    }
  }
  return { table: sets, left };
}

/**
 * Borrows tiles the table can spare — the end of a run of four or more, any tile of a group of four —
 * to make new sets with rack tiles, one borrowed tile per new set.
 */
export function borrow(table: number[][], rack: number[]): { table: number[][]; left: number[] } {
  let sets = table.map((s) => [...s]);
  let left = [...rack];
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < sets.length; i++) {
      const s = sets[i]!;
      const read = readSet(s);
      if (!read || s.length < 4) continue;
      const nums = s.filter((t) => !isJoker(t)).map(numberOf);
      // Any tile of a group of four; the lowest or highest tile of a run (the rest must stay valid).
      const spare =
        read.kind === 'group'
          ? s
          : s.filter(
              (t) =>
                !isJoker(t) &&
                (numberOf(t) === Math.min(...nums) || numberOf(t) === Math.max(...nums)),
            );
      for (const t of spare) {
        const rest = s.filter((x) => x !== t);
        if (!readSet(rest)) continue;
        const made = setsFrom([...left, t]).filter((x) => x.includes(t) && x.length >= 3);
        if (!made.length) continue;
        const best = made.sort((a, b) => b.length - a.length)[0]!;
        sets = sets.map((x, k) => (k === i ? rest : x));
        sets.push(best);
        left = left.filter((x) => !best.includes(x));
        changed = true;
        break outer;
      }
    }
  }
  return { table: sets, left };
}

/** Candidate tables after a play, best first; empty when nothing can be played. */
export function candidatePlays(table: number[][], rack: number[], melded: boolean): number[][][] {
  if (!melded) {
    const sets = bestSets(rack, true);
    if (sets.reduce((a, s) => a + setValue(s), 0) < INITIAL_MELD) return [];
    return [[...table, ...sets]];
  }
  const fresh = bestSets(rack, false);
  const rest = rack.filter((t) => !fresh.some((s) => s.includes(t)));
  const extended = extend([...table, ...fresh], rest);
  const borrowed = borrow(extended.table, extended.left);
  const full = extend(borrowed.table, borrowed.left).table;
  const placed = (tb: number[][]) => tb.flat().length - table.flat().length;
  // The fullest play, the rack's own sets alone, and additions to the table alone (distinct ones).
  const options = [full, fresh.length ? [...table, ...fresh] : table, extend(table, rack).table];
  const seen = new Set<string>();
  const out: number[][][] = [];
  for (const o of options) {
    const k = JSON.stringify(o);
    if (placed(o) > 0 && !seen.has(k)) {
      seen.add(k);
      out.push(o);
    }
  }
  return out;
}
