import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { findPaths } from '../ai';
import { DICTS, applyStrands, env, finderMove } from '../ai-adapter';
import {
  COLS,
  ROWS,
  adjacent,
  answers,
  letterAt,
  newGame,
  puzzleById,
  shareLine,
  submitPath,
  takeHint,
  validTrace,
} from '../engine';
import { PUZZLES } from '../puzzles';

describe('Theme Strands puzzles', () => {
  it('cover all 48 cells exactly once with adjacent, spelled paths and a side-to-side spangram', () => {
    expect(PUZZLES.filter((p) => p.lang === 'en').length).toBeGreaterThanOrEqual(12);
    expect(PUZZLES.filter((p) => p.lang === 'es').length).toBeGreaterThanOrEqual(8);
    for (const p of PUZZLES) {
      expect(p.rows).toHaveLength(ROWS);
      expect(
        p.rows.every((r) => r.length === COLS),
        p.id,
      ).toBe(true);
      const cells = answers(p).flatMap((w) => p.paths[w]!);
      expect(cells.length, p.id).toBe(48);
      expect(new Set(cells).size, p.id).toBe(48);
      for (const w of answers(p)) {
        const path = p.paths[w]!;
        expect(path.map((c) => letterAt(p, c)).join(''), `${p.id} ${w}`).toBe(w);
        expect(
          path.every((c, i) => i === 0 || adjacent(path[i - 1]!, c)),
          `${p.id} ${w}`,
        ).toBe(true);
      }
      const sp = p.paths[p.spangram]!;
      const cols = sp.map((c) => c % COLS);
      const rows = sp.map((c) => Math.floor(c / COLS));
      const across = cols.includes(0) && cols.includes(COLS - 1);
      const down = rows.includes(0) && rows.includes(ROWS - 1);
      expect(across || down, `${p.id} spangram spans`).toBe(true);
    }
  });
});

describe('Theme Strands rules', () => {
  const p = puzzleById('en-desserts');
  const yes = (w: string) => DICTS.en.has(w);

  it('accepts theme words on their cells, the spangram, and hint words', () => {
    let s = newGame(p);
    const r1 = submitPath(s, p.paths.TART!, yes);
    expect(r1.result).toBe('theme');
    s = r1.state;
    expect(submitPath(s, p.paths.TART!, yes).result).toBe('invalid');
    const r2 = submitPath(s, p.paths[p.spangram]!, yes);
    expect(r2.result).toBe('spangram');
    s = r2.state;
    expect(validTrace(s, [0, 2])).toBe(false);
    expect(submitPath(s, [0, 1, 6], yes).result).toBe('too-short');
  });

  it('earns hints from three extra words, outlines then spells a word, and wins', () => {
    let s = newGame(p);
    const extras = findPaths(s, DICTS.en).filter(
      (path) => submitPath(s, path, (w) => DICTS.en.has(w)).result === 'hint-word',
    );
    expect(extras.length).toBeGreaterThanOrEqual(3);
    let added = 0;
    for (const path of extras) {
      const r = submitPath(s, path, (w) => DICTS.en.has(w));
      if (r.result === 'hint-word') {
        s = r.state;
        added++;
      }
      if (added === 6) break;
    }
    s = takeHint(s);
    expect(s.hint?.spelled).toBe(false);
    s = takeHint(s);
    expect(s.hint?.spelled).toBe(true);
    for (const w of answers(p)) s = submitPath(s, p.paths[w]!, yes).state;
    expect(s.status).toBe('won');
    expect(shareLine(s)).toContain('🟡');
    expect(shareLine(s).match(/💡/g)?.length).toBe(2);
  });

  it('lets the word finder complete every puzzle', () => {
    for (const puzzle of PUZZLES) {
      let s = env.createInitialState({ puzzle: puzzle.id }, 1);
      for (let i = 0; i < 400 && s.status === 'playing'; i++) s = applyStrands(s, finderMove(s));
      expect(s.status, puzzle.id).toBe('won');
    }
  });
});

describeAdapterContract(env, {
  configs: [{ puzzle: 'en-cats' }, { puzzle: 'es-mar' }],
  playouts: 2,
  maxSteps: 600,
  illegalActions: () => ['p:0,40', 'p:', 'hint'].filter((a) => a !== 'hint') as never[],
});
