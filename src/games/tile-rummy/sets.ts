/** Tile Rummy tiles and sets: ids, colours, numbers, and how a set of tiles reads as a run or a group. */
export const JOKERS = [104, 105];
export const isJoker = (t: number) => t >= 104;
export const colourOf = (t: number) => Math.floor(t / 26);
export const numberOf = (t: number) => Math.floor((t % 26) / 2) + 1;
export const HAND = 14;
export const INITIAL_MELD = 30;
export const JOKER_PENALTY = 30;

/** How a valid set reads: the number each tile (jokers included) stands for, in order; null if invalid. */
export function readSet(
  set: readonly number[],
): { kind: 'run' | 'group'; values: number[] } | null {
  if (set.length < 3) return null;
  const plain = set.filter((t) => !isJoker(t));
  const jokers = set.length - plain.length;
  if (!plain.length)
    return set.length <= 13 ? { kind: 'run', values: set.map((_, i) => i + 1) } : null;
  const nums = plain.map(numberOf);
  const cols = plain.map(colourOf);
  // A group: one number, distinct colours, at most four.
  if (nums.every((n) => n === nums[0]) && new Set(cols).size === cols.length && set.length <= 4)
    return { kind: 'group', values: set.map(() => nums[0]!) };
  // A run: one colour, distinct numbers, the gaps filled by jokers.
  if (cols.every((c) => c === cols[0]) && new Set(nums).size === nums.length) {
    const lo = Math.min(...nums);
    const hi = Math.max(...nums);
    const gaps = hi - lo + 1 - nums.length;
    if (gaps > jokers || set.length > 13) return null;
    // Extra jokers go above the run when there is room, otherwise below.
    let extra = jokers - gaps;
    const up = Math.min(extra, 13 - hi);
    extra -= up;
    const start = lo - extra;
    if (start < 1) return null;
    return { kind: 'run', values: Array.from({ length: set.length }, (_, i) => start + i) };
  }
  return null;
}

export const setValue = (set: readonly number[]) =>
  readSet(set)?.values.reduce((a, b) => a + b, 0) ?? 0;
export const tilePenalty = (t: number) => (isJoker(t) ? JOKER_PENALTY : numberOf(t));
export const rackValue = (r: readonly number[]) => r.reduce((a, t) => a + tilePenalty(t), 0);

export const sortRack = (r: number[]) => [...r].sort((a, b) => sortKey(a) - sortKey(b));
/** Rack order: by colour, then number; jokers last. */
export const sortKey = (t: number) =>
  isJoker(t) ? 1000 + t : colourOf(t) * 100 + numberOf(t) * 2 + (t % 2);
