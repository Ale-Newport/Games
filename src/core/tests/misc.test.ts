import { describe, expect, it } from 'vitest';
import { parseHash, href } from '../../app/router';
import { allLines, moveCursor } from '../game-engine/grid';
import { createTranslator, detectLocale, interpolate } from '../i18n';
import { isLevelUnlocked, recordLevelResult } from '../levels/progression';
import { createFixedStepLoop } from '../rendering/fixed-step-loop';

describe('router', () => {
  it('parses hash routes with queries', () => {
    expect(parseHash('')).toMatchObject({ path: '/', segments: [] });
    const r = parseHash('#/game/tic-tac-toe?mode=watch');
    expect(r.segments).toEqual(['game', 'tic-tac-toe']);
    expect(r.query.get('mode')).toBe('watch');
    expect(href('/library', { q: 'chess', category: undefined })).toBe('#/library?q=chess');
  });
});

describe('i18n', () => {
  it('interpolates and falls back', () => {
    const t = createTranslator({ en: { a: 'Hi {name}', b: 'B' }, es: { a: 'Hola {name}' } }, 'es');
    expect(t('a', { name: 'Ana' })).toBe('Hola Ana');
    expect(t('b')).toBe('B');
    expect(t('missing')).toBe('missing');
    expect(interpolate('{x}{y}', { x: 1 })).toBe('1{y}');
    expect(detectLocale(['es-MX', 'en'])).toBe('es');
    expect(detectLocale(['fr'])).toBe('en');
  });
});

describe('grid helpers', () => {
  it('enumerates lines of length k', () => {
    expect(allLines({ rows: 3, cols: 3 }, 3)).toHaveLength(8);
    expect(allLines({ rows: 4, cols: 4 }, 4)).toHaveLength(10);
    expect(allLines({ rows: 6, cols: 7 }, 4)).toHaveLength(69);
  });

  it('moves cursors with clamping and wrapping', () => {
    const size = { rows: 3, cols: 3 };
    expect(moveCursor(0, 'up', size)).toBe(0);
    expect(moveCursor(0, 'up', size, true)).toBe(6);
    expect(moveCursor(4, 'right', size)).toBe(5);
    expect(moveCursor(5, 'right', size, true)).toBe(3);
  });
});

describe('level progression', () => {
  it('unlocks sequentially and merges records', () => {
    const ids = ['a', 'b', 'c'];
    let p = { levels: {} };
    expect(isLevelUnlocked(ids, 0, p)).toBe(true);
    expect(isLevelUnlocked(ids, 1, p)).toBe(false);
    p = recordLevelResult(p, 'a', { completed: true, bestScore: 5 });
    expect(isLevelUnlocked(ids, 1, p)).toBe(true);
    expect(isLevelUnlocked(ids, 2, p)).toBe(false);
    expect(isLevelUnlocked(ids, 2, p, { window: 2 })).toBe(true);
    p = recordLevelResult(p, 'a', { completed: false, bestScore: 99 });
    expect(p.levels).toEqual({
      a: { completed: true, bestScore: 5, bestTimeMs: undefined, rating: undefined },
    });
  });
});

describe('fixed-step loop', () => {
  it('runs a fixed number of updates regardless of frame timing', () => {
    let updates = 0;
    const loop = createFixedStepLoop({
      hz: 60,
      update: () => updates++,
      render: () => {},
      requestFrame: () => 0,
      cancelFrame: () => {},
    });
    loop.frame(0);
    loop.frame(1000 / 60);
    loop.frame(1000 / 60 + 1000 / 30);
    expect(updates).toBe(3);
    loop.frame(10_000); // long stall clamps to maxStepsPerFrame
    expect(updates).toBe(8);
  });
});
