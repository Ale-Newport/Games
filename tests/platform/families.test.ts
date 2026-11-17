import { describe, expect, it } from 'vitest';
import { groupByFamily } from '../../src/app/pages/LibraryPage';
import { FAMILIES, familyOf } from '../../src/data/families';
import { ROADMAP } from '../../src/data/roadmap';
import { MANIFESTS } from '../../src/games/registry';

describe('game families', () => {
  it('reference catalog games, each in at most one family, with two or more members', () => {
    const ids = new Set(ROADMAP.map((e) => e.id));
    const seen = new Set<string>();
    for (const f of FAMILIES) {
      expect(f.members.length, f.id).toBeGreaterThanOrEqual(2);
      expect(f.name.en.trim() && f.name.es.trim(), f.id).toBeTruthy();
      for (const m of f.members) {
        expect(ids.has(m), `${f.id}: ${m}`).toBe(true);
        expect(seen.has(m), `${m} in two families`).toBe(false);
        seen.add(m);
      }
    }
    expect(new Set(FAMILIES.map((f) => f.id)).size).toBe(FAMILIES.length);
  });

  it('groups the library so every family appears once with all its members together', () => {
    const items = groupByFamily(MANIFESTS);
    const shown = items.flatMap((i) =>
      i.kind === 'game' ? [i.manifest.id] : i.games.map((g) => g.id),
    );
    expect(shown.sort()).toEqual(MANIFESTS.map((m) => m.id).sort());
    const chess = items.find((i) => i.kind === 'family' && i.family.id === 'chess');
    expect(chess?.kind === 'family' && chess.games.map((g) => g.id)).toEqual([
      'chess',
      'chess960',
      'antichess',
      'king-of-the-hill',
      'three-check-chess',
      'gardner-minichess',
    ]);
    for (const i of items) if (i.kind === 'game') expect(familyOf(i.manifest.id)).toBeUndefined();
  });

  it('shows a family with a single visible member as a plain card', () => {
    const only = MANIFESTS.filter((m) => m.id === 'chess960' || m.id === 'tic-tac-toe');
    const items = groupByFamily(only);
    expect(items.every((i) => i.kind === 'game')).toBe(true);
  });
});
