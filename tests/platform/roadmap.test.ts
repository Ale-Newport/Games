import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_BUNDLES } from '../../src/ai/adapters/registry';
import { LOCALES } from '../../src/core/i18n';
import { ROADMAP, type CategoryId } from '../../src/data/roadmap';
import { renderRoadmapMarkdown } from '../../src/data/roadmap-markdown';
import { GAMES } from '../../src/games/registry';

const root = join(import.meta.dirname, '..', '..');
const CATEGORY_RANGES: [CategoryId, number, number][] = [
  ['board', 1, 40],
  ['strategy', 41, 70],
  ['cards', 71, 100],
  ['puzzle', 101, 140],
  ['dice', 141, 165],
  ['arcade', 166, 200],
];

describe('roadmap', () => {
  it('defines exactly 200 unique games numbered 1..200', () => {
    expect(ROADMAP).toHaveLength(200);
    expect(ROADMAP.map((e) => e.number)).toEqual(Array.from({ length: 200 }, (_, i) => i + 1));
    expect(new Set(ROADMAP.map((e) => e.id)).size).toBe(200);
    expect(new Set(ROADMAP.map((e) => e.name)).size).toBe(200);
    for (const e of ROADMAP) expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('assigns categories by catalog range', () => {
    for (const [category, from, to] of CATEGORY_RANGES) {
      for (const e of ROADMAP.filter((x) => x.number >= from && x.number <= to))
        expect(e.category).toBe(category);
    }
  });

  it('only marks games COMPLETE when every part is done and dated', () => {
    for (const e of ROADMAP.filter((x) => x.status === 'COMPLETE')) {
      expect([e.engine, e.graphics, e.content, e.tests, e.ai], e.id).toEqual([
        'done',
        'done',
        'done',
        'done',
        'done',
      ]);
      expect(e.completed, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps ROADMAP.md in sync (run `npm run roadmap`)', () => {
    expect(readFileSync(join(root, 'ROADMAP.md'), 'utf8')).toBe(renderRoadmapMarkdown());
  });
});

describe('game registry', () => {
  it('registers only COMPLETE games, with matching catalog data', () => {
    const ids = GAMES.map((g) => g.manifest.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { manifest } of GAMES) {
      const entry = ROADMAP.find((e) => e.id === manifest.id);
      expect(entry, manifest.id).toBeDefined();
      expect(entry!.status, `${manifest.id} must be COMPLETE to be playable`).toBe('COMPLETE');
      expect(manifest.number).toBe(entry!.number);
      expect(manifest.category).toBe(entry!.category);
    }
  });

  it('registers every COMPLETE game', () => {
    const ids = new Set(GAMES.map((g) => g.manifest.id));
    for (const e of ROADMAP.filter((x) => x.status === 'COMPLETE'))
      expect(ids.has(e.id), e.id).toBe(true);
  });

  it('gives every registered game its module files, docs, tests and AI bundle', () => {
    for (const { manifest } of GAMES) {
      const dir = join(root, 'src', 'games', manifest.id);
      for (const file of [
        'GAME_SPEC.md',
        'README.md',
        'manifest.ts',
        'ai-adapter.ts',
        'index.ts',
      ]) {
        expect(existsSync(join(dir, file)), `${manifest.id}/${file}`).toBe(true);
      }
      const testDir = join(dir, 'tests');
      expect(existsSync(testDir), `${manifest.id}/tests`).toBe(true);
      expect(
        readdirSync(testDir).some((f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx')),
        `${manifest.id} tests`,
      ).toBe(true);
      expect(manifest.id in AI_BUNDLES, `${manifest.id} AI bundle`).toBe(true);
    }
    for (const id of Object.keys(AI_BUNDLES))
      expect(
        GAMES.some((g) => g.manifest.id === id),
        id,
      ).toBe(true);
  });

  it('has complete, localized manifests', () => {
    for (const { manifest } of GAMES) {
      for (const locale of LOCALES) {
        for (const text of [
          manifest.title,
          manifest.tagline,
          manifest.description,
          manifest.genre,
        ]) {
          expect(text[locale].trim().length, `${manifest.id} ${locale}`).toBeGreaterThan(0);
        }
        for (const a of manifest.achievements)
          expect(a.title[locale] && a.description[locale], a.id).toBeTruthy();
      }
      expect(new Set(manifest.achievements.map((a) => a.id)).size).toBe(
        manifest.achievements.length,
      );
      expect(manifest.preview.length).toBeGreaterThan(0);
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(manifest.players.min).toBeLessThanOrEqual(manifest.players.max);
    }
  });

  it('loads every AI bundle with a matching environment and agents', async () => {
    for (const [id, load] of Object.entries(AI_BUNDLES)) {
      const bundle = await load();
      const manifest = GAMES.find((g) => g.manifest.id === id)!.manifest;
      expect(bundle.env.id).toBe(id);
      expect(bundle.env.version).toBe(manifest.version);
      expect(bundle.env.rulesetId).toBe(manifest.rulesetId);
      expect(bundle.agents.length).toBeGreaterThan(0);
      expect(new Set(bundle.agents.map((a) => a.id)).size).toBe(bundle.agents.length);
    }
  });
});
