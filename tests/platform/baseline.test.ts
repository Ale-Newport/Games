/**
 * Regression guard for the game expansion (231+): the 230 games that were playable before it
 * (recorded in baseline-games.json at commit 18ea1be) must stay registered with the same number,
 * category and route, keep their AI bundle, preview art and module files, and none of the files
 * that existed under src/games/ at that commit may disappear (baseline-files.txt).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_BUNDLES } from '../../src/ai/adapters/registry';
import { ROADMAP } from '../../src/data/roadmap';
import { GAMES } from '../../src/games/registry';

const root = join(import.meta.dirname, '..', '..');
const here = import.meta.dirname;

interface BaselineGame {
  number: number;
  id: string;
  name: string;
  category: string;
  route: string;
}
const baseline = JSON.parse(readFileSync(join(here, 'baseline-games.json'), 'utf8')) as {
  count: number;
  games: BaselineGame[];
};
const files = readFileSync(join(here, 'baseline-files.txt'), 'utf8').split('\n').filter(Boolean);

describe('baseline games (pre-expansion)', () => {
  it('records the 230 games that were playable before the expansion', () => {
    expect(baseline.count).toBe(230);
    expect(baseline.games).toHaveLength(230);
  });

  it('keeps every baseline game registered, COMPLETE, with the same number and category', () => {
    const byId = new Map(GAMES.map((g) => [g.manifest.id, g.manifest]));
    for (const b of baseline.games) {
      const m = byId.get(b.id);
      expect(m, `${b.id} is still registered`).toBeDefined();
      expect(m!.number, b.id).toBe(b.number);
      expect(m!.category, b.id).toBe(b.category);
      expect(ROADMAP.find((e) => e.id === b.id)?.status, b.id).toBe('COMPLETE');
      expect(b.route).toBe(`#/game/${b.id}`);
    }
  });

  it('keeps every baseline game loadable: module entry, AI bundle and preview art', () => {
    for (const b of baseline.games) {
      const dir = join(root, 'src', 'games', b.id);
      expect(existsSync(join(dir, 'index.ts')), `${b.id}/index.ts`).toBe(true);
      expect(existsSync(join(dir, 'assets', 'preview.svg')), `${b.id} preview`).toBe(true);
      expect(b.id in AI_BUNDLES, `${b.id} AI bundle`).toBe(true);
    }
  });

  it('deletes none of the game files that existed before the expansion', () => {
    expect(files.length).toBeGreaterThan(3000);
    const missing = files.filter((f) => !existsSync(join(root, f)));
    expect(missing).toEqual([]);
  });
});
