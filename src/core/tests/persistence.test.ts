import { describe, expect, it } from 'vitest';
import { IndexedDbStore, MemoryStore } from '../persistence/kv-store';
import { isRecord, unwrap, wrap, type VersionedSpec } from '../persistence/versioned';
import { ProfileStore, applyResult, emptyModeStats } from '../profiles/profile-store';

interface V2 {
  name: string;
  level: number;
}

const spec: VersionedSpec<V2> = {
  schema: 2,
  migrations: { 1: (d) => ({ ...(d as object), level: 1 }) },
  validate: (d): d is V2 =>
    isRecord(d) && typeof d.name === 'string' && typeof d.level === 'number',
};

describe('versioned envelopes', () => {
  it('round-trips current data', () => {
    const r = unwrap(spec, wrap(spec, { name: 'a', level: 3 }));
    expect(r).toMatchObject({ ok: true, data: { name: 'a', level: 3 }, migrated: false });
  });

  it('migrates older schemas', () => {
    const r = unwrap(spec, { schema: 1, savedAt: 1, data: { name: 'old' } });
    expect(r).toMatchObject({ ok: true, data: { name: 'old', level: 1 }, migrated: true });
  });

  it('rejects corrupted, invalid and future data without throwing', () => {
    expect(unwrap(spec, undefined)).toEqual({ ok: false, reason: 'missing' });
    expect(unwrap(spec, 'garbage')).toEqual({ ok: false, reason: 'malformed' });
    expect(unwrap(spec, { schema: 'x', data: {} })).toEqual({ ok: false, reason: 'malformed' });
    expect(unwrap(spec, { schema: 9, data: {} })).toEqual({ ok: false, reason: 'future-schema' });
    expect(unwrap(spec, { schema: 2, data: { name: 5 } })).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(unwrap(spec, { schema: 0, data: {} })).toEqual({
      ok: false,
      reason: 'migration-failed',
    });
  });
});

describe('IndexedDbStore', () => {
  it('stores, lists and deletes values', async () => {
    const store = new IndexedDbStore(`test-${Math.random()}`);
    await store.set('a:1', { x: 1 });
    await store.set('a:2', [1, 2]);
    await store.set('b:1', 'y');
    expect(await store.get('a:1')).toEqual({ x: 1 });
    expect((await store.keys('a:')).sort()).toEqual(['a:1', 'a:2']);
    await store.delete('a:1');
    expect(await store.get('a:1')).toBeUndefined();
  });
});

describe('ProfileStore', () => {
  it('creates a default profile and persists favorites, results and achievements', async () => {
    const kv = new MemoryStore();
    let t = 1000;
    const store = await ProfileStore.open(kv, () => t++);
    store.toggleFavorite('tic-tac-toe');
    store.recordOpened('tic-tac-toe');
    store.recordResult('tic-tac-toe', { outcome: 'win', mode: 'vs-ai:hard' });
    store.recordResult('tic-tac-toe', { outcome: 'draw', mode: 'vs-ai:hard' });
    expect(store.unlockAchievement('tic-tac-toe', 'first-win')).toBe(true);
    expect(store.unlockAchievement('tic-tac-toe', 'first-win')).toBe(false);
    await store.flush();

    const reopened = await ProfileStore.open(kv);
    const profile = reopened.getProfile();
    expect(profile.favorites).toEqual(['tic-tac-toe']);
    expect(profile.recent[0]?.gameId).toBe('tic-tac-toe');
    expect(profile.stats['tic-tac-toe']).toMatchObject({ played: 2, wins: 1, draws: 1 });
    expect(profile.stats['tic-tac-toe']?.modes['vs-ai:hard']?.played).toBe(2);
    expect(profile.achievements['tic-tac-toe']?.['first-win']).toBeGreaterThan(0);
  });

  it('recovers from a corrupted profile record', async () => {
    const kv = new MemoryStore();
    const store = await ProfileStore.open(kv);
    const id = store.getProfile().id;
    await kv.set(`profile:${id}`, { schema: 1, data: { broken: true } });
    const reopened = await ProfileStore.open(kv);
    expect(reopened.getProfile().favorites).toEqual([]);
  });

  it('manages saves and profiles independently', async () => {
    const kv = new MemoryStore();
    const store = await ProfileStore.open(kv);
    await store.writeSave('g', { schema: 1, savedAt: 0, data: { n: 1 } });
    expect(store.getProfile().saves.g).toBeDefined();
    const firstId = store.getProfile().id;
    await store.createProfile('Second');
    expect(store.getProfile().name).toBe('Second');
    expect(await store.readSave('g')).toBeUndefined();
    await store.switchProfile(firstId);
    expect(await store.readSave('g')).toBeDefined();
    await store.clearSave('g');
    expect(store.getProfile().saves.g).toBeUndefined();
    await store.resetProgress();
    expect(store.getProfile().stats).toEqual({});
  });

  it('tracks streaks and best scores', () => {
    let s = emptyModeStats();
    s = applyResult(s, { outcome: 'win', score: 10 });
    s = applyResult(s, { outcome: 'win', score: 5 });
    s = applyResult(s, { outcome: 'loss' });
    expect(s).toMatchObject({
      played: 3,
      wins: 2,
      losses: 1,
      streak: 0,
      bestStreak: 2,
      bestScore: 10,
    });
    expect(applyResult(emptyModeStats(), { outcome: 'complete', score: 7 }, true).bestScore).toBe(
      7,
    );
  });
});
