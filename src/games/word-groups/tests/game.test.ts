import { describe, expect, it } from 'vitest';
import {
  dailyPuzzle,
  deselectAll,
  isValidState,
  newGame,
  puzzleById,
  revealOrder,
  shareGrid,
  shuffle,
  submit,
  toggle,
  type GroupsState,
} from '../engine';
import { PUZZLES } from '../puzzles';

const pick = (s: GroupsState, words: readonly string[]) =>
  words.reduce((acc, w) => toggle(acc, w), deselectAll(s));

describe('Word Groups puzzles', () => {
  it('has well-formed puzzles: four groups of four, sixteen distinct words', () => {
    expect(PUZZLES.filter((p) => p.lang === 'en').length).toBeGreaterThanOrEqual(16);
    expect(PUZZLES.filter((p) => p.lang === 'es').length).toBeGreaterThanOrEqual(12);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    for (const p of PUZZLES) {
      const words = p.groups.flatMap((g) => g.words);
      expect(words, p.id).toHaveLength(16);
      expect(new Set(words).size, `${p.id} repeats a word`).toBe(16);
      for (const g of p.groups) expect(g.label.length, p.id).toBeGreaterThan(2);
    }
  });
});

describe('Word Groups rules', () => {
  const p = puzzleById('en-7');

  it('solves a group, says one away and counts mistakes', () => {
    let s = newGame(p, 1);
    s = pick(s, p.groups[1]!.words);
    let r = submit(s);
    expect(r.feedback).toBe('solved');
    expect(r.state.board).toHaveLength(12);
    s = pick(r.state, ['TOAST', 'EULOGY', 'LECTURE', 'NICK']);
    r = submit(s);
    expect(r.feedback).toBe('one-away');
    expect(r.state.mistakes).toBe(1);
    expect(submit(r.state).feedback).toBe('repeat');
    s = pick(r.state, ['TOAST', 'BACON', 'NICK', 'PINCH']);
    r = submit(s);
    expect(r.feedback).toBe('wrong');
    expect(
      toggle(
        toggle(toggle(toggle(toggle(deselectAll(r.state), 'TOAST'), 'BACON'), 'NICK'), 'PINCH'),
        'LIFT',
      ).selected,
    ).toHaveLength(4);
  });

  it('wins with all four groups and loses on the fourth mistake', () => {
    let s = newGame(p, 2);
    for (const g of [3, 0, 2, 1]) s = submit(pick(s, p.groups[g]!.words)).state;
    expect(s.status).toBe('won');
    expect(s.solved).toEqual([3, 0, 2, 1]);
    expect(shareGrid(s).split('\n')[0]).toBe('🟪🟪🟪🟪');
    let t = newGame(p, 3);
    const wrongs = [
      ['CEREAL', 'POACH', 'TOAST', 'NICK'],
      ['BACON', 'FRY', 'EULOGY', 'PINCH'],
      ['WAFFLE', 'SCRAMBLE', 'LECTURE', 'LIFT'],
      ['PORRIDGE', 'BOIL', 'SERMON', 'SWIPE'],
    ];
    for (const w of wrongs) t = submit(pick(t, w)).state;
    expect(t.status).toBe('lost');
    expect(revealOrder(t)).toEqual([0, 1, 2, 3]);
    expect(isValidState(t)).toBe(true);
  });

  it('shuffles only the board order and picks daily puzzles per language', () => {
    const s = newGame(p, 4);
    const t = shuffle(s);
    expect([...t.board].sort()).toEqual([...s.board].sort());
    expect(dailyPuzzle('es', 10).lang).toBe('es');
    expect(dailyPuzzle('en', 10)).toBe(dailyPuzzle('en', 10));
  });
});

describe('Word Groups AI', () => {
  it('clusters by meaning well enough to solve some English puzzles', async () => {
    const { env, applyGroups, vectors } = await import('../ai-adapter');
    const { clusterMove } = await import('../ai');
    let solvedGroups = 0;
    for (const p of PUZZLES.filter((x) => x.lang === 'en')) {
      let s = env.createInitialState({ puzzle: p.id }, 1);
      while (s.status === 'playing') s = applyGroups(s, clusterMove(vectors, s));
      solvedGroups += s.solved.length;
    }
    expect(solvedGroups).toBeGreaterThanOrEqual(12); // measured: 16 groups over 16 puzzles
  });
});
