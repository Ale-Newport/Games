import { describe, expect, it } from 'vitest';
import { Rng } from '../../../../core/game-engine/random';
import { logicMove } from '../ai';
import {
  chord,
  countAround,
  deduce,
  flagsLeft,
  hintFor,
  isValidMinesState,
  layoutFor,
  neighbours,
  newMines,
  reveal,
  solvableWithoutGuessing,
  toggleFlag,
} from '../engine';

const SPEC = { rows: 9, cols: 9, mines: 10 };
const SPECS = { beginner: SPEC };

describe('minesweeper engine', () => {
  it('places mines after the first reveal, away from it, the same way every time', () => {
    const s = reveal(newMines('beginner', SPEC, 42, false), 40);
    expect(s.status).toBe('playing');
    expect(s.mines.filter(Boolean)).toHaveLength(10);
    for (const c of [40, ...neighbours(9, 9, 40)]) expect(s.mines[c]).toBe(false);
    expect(layoutFor(s, 40)).toEqual(s.mines);
    // The first cell has no mine around it, so it opens an area.
    expect(s.revealed.filter(Boolean).length).toBeGreaterThan(1);
  });

  it('flags, chords, loses on a mine and wins by opening every safe cell', () => {
    let s = reveal(newMines('beginner', SPEC, 7, false), 40);
    const mine = s.mines.indexOf(true);
    s = toggleFlag(s, mine);
    expect(s.flags[mine]).toBe(true);
    expect(flagsLeft(s)).toBe(9);
    expect(reveal(s, mine)).toBe(s);
    // A number next to the flagged mine with exactly one mine around: chord opens the rest.
    const num = neighbours(9, 9, mine).find((c) => s.revealed[c] && countAround(s, c) === 1);
    if (num !== undefined) expect(chord(s, num).status).not.toBe('lost');
    const lost = reveal(toggleFlag(s, mine), mine);
    expect(lost.status).toBe('lost');
    expect(lost.exploded).toBe(mine);
    let won = s;
    for (let c = 0; c < 81; c++) if (!won.mines[c]) won = reveal(won, c);
    expect(won.status).toBe('won');
    expect(won.flags.filter(Boolean)).toHaveLength(10);
  });

  it('deduces safe cells and mines from single numbers, pairs and the count', () => {
    // 2×2: an open "1" at a corner touching three closed cells cannot decide alone.
    const d = deduce(2, 2, 1, [true, false, false, false], () => 1, new Set());
    expect(d).toBeNull();
    // ... but with the one mine counted, the other closed cells are safe.
    expect(deduce(2, 2, 1, [true, false, false, false], () => 1, new Set([3]))!.safe).toEqual([
      1, 2,
    ]);
    const e = deduce(1, 2, 1, [true, false], () => 1, new Set());
    expect(e).toEqual({ technique: 'single', safe: [], mines: [1], from: [0] });
    const f = deduce(1, 3, 0, [true, false, false], () => 0, new Set());
    expect(f!.safe).toEqual([1]);
  });

  it('builds no-guess boards that deductions alone clear', () => {
    const s = reveal(newMines('beginner', SPEC, 9, true), 40);
    expect(solvableWithoutGuessing(9, 9, 10, s.mines, 40)).toBe(true);
    let g = s;
    for (let i = 0; i < 200 && g.status === 'playing'; i++) {
      const h = hintFor(g)!;
      expect(h).not.toBeNull();
      for (const m of h.mines) if (!g.flags[m]) g = toggleFlag(g, m);
      for (const x of h.safe) g = reveal(g, x);
    }
    expect(g.status).toBe('won');
  });

  it('validates saves by regenerating the layout', () => {
    const fresh = newMines('beginner', SPEC, 3, false);
    expect(isValidMinesState(fresh, SPECS, false)).toBe(true);
    const s = reveal(fresh, 10);
    expect(isValidMinesState(JSON.parse(JSON.stringify(s)), SPECS, false)).toBe(true);
    expect(isValidMinesState({ ...s, seed: 4 }, SPECS, false)).toBe(false);
    expect(isValidMinesState(s, SPECS, true)).toBe(false);
  });

  it('plays with the deduction agent', () => {
    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let s = newMines('beginner', SPEC, seed, false);
      for (let i = 0; i < 100 && (s.status === 'ready' || s.status === 'playing'); i++)
        s = reveal(s, Number(logicMove(s).slice(2)));
      if (s.status === 'won') wins++;
    }
    expect(wins).toBeGreaterThan(10);
    expect(new Rng(1).int(2)).toBeGreaterThanOrEqual(0);
  });
});
