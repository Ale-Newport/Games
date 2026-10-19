import type { KeyValueStore } from '../persistence/kv-store';
import { isRecord, unwrap, wrap, type VersionedSpec } from '../persistence/versioned';

export type ResultKind = 'win' | 'loss' | 'draw' | 'complete' | 'fail';

export interface GameResult {
  outcome: ResultKind;
  /** Game-defined score; higher is better unless the manifest says otherwise. */
  score?: number;
  /** Completion time in milliseconds (puzzles, races). Lower is better. */
  timeMs?: number;
  /** Mode key such as 'vs-ai:hard' or 'local'. Per-mode tallies are kept. */
  mode?: string;
}

export interface ModeStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  completions: number;
  bestScore?: number;
  bestTimeMs?: number;
  /** Current and best streak of wins/completions. */
  streak: number;
  bestStreak: number;
}

export interface GameStats extends ModeStats {
  firstPlayed: number;
  lastPlayed: number;
  modes: Record<string, ModeStats>;
}

export interface ProfileData {
  id: string;
  name: string;
  createdAt: number;
  favorites: string[];
  /** Most recent first, unique game ids. */
  recent: { gameId: string; at: number }[];
  stats: Record<string, GameStats>;
  /** gameId -> achievementId -> unlock timestamp. */
  achievements: Record<string, Record<string, number>>;
  /** gameId -> savedAt for games with a resumable save. */
  saves: Record<string, number>;
}

export interface ProfilesIndex {
  activeId: string;
  profiles: { id: string; name: string }[];
}

const PROFILES_KEY = 'profiles';
const profileKey = (id: string) => `profile:${id}`;
export const saveKey = (profileId: string, gameId: string) => `save:${profileId}:${gameId}`;
const RECENT_LIMIT = 12;

export const profileSpec: VersionedSpec<ProfileData> = {
  schema: 1,
  validate: (d): d is ProfileData =>
    isRecord(d) &&
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    Array.isArray(d.favorites) &&
    Array.isArray(d.recent) &&
    isRecord(d.stats) &&
    isRecord(d.achievements) &&
    isRecord(d.saves),
};

const indexSpec: VersionedSpec<ProfilesIndex> = {
  schema: 1,
  validate: (d): d is ProfilesIndex =>
    isRecord(d) && typeof d.activeId === 'string' && Array.isArray(d.profiles),
};

export function emptyModeStats(): ModeStats {
  return { played: 0, wins: 0, losses: 0, draws: 0, completions: 0, streak: 0, bestStreak: 0 };
}

export function newProfile(name: string, id = makeId(), now = Date.now()): ProfileData {
  return {
    id,
    name,
    createdAt: now,
    favorites: [],
    recent: [],
    stats: {},
    achievements: {},
    saves: {},
  };
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function applyResult(
  stats: ModeStats,
  result: GameResult,
  lowerScoreIsBetter = false,
): ModeStats {
  const next = { ...stats, played: stats.played + 1 };
  if (result.outcome === 'win') next.wins++;
  if (result.outcome === 'loss') next.losses++;
  if (result.outcome === 'draw') next.draws++;
  if (result.outcome === 'complete') next.completions++;
  const success = result.outcome === 'win' || result.outcome === 'complete';
  next.streak = success ? stats.streak + 1 : result.outcome === 'draw' ? stats.streak : 0;
  next.bestStreak = Math.max(stats.bestStreak, next.streak);
  if (result.score !== undefined) {
    const better = lowerScoreIsBetter
      ? result.score < (stats.bestScore ?? Infinity)
      : result.score > (stats.bestScore ?? -Infinity);
    if (better) next.bestScore = result.score;
  }
  if (result.timeMs !== undefined && success && result.timeMs < (stats.bestTimeMs ?? Infinity)) {
    next.bestTimeMs = result.timeMs;
  }
  return next;
}

type Listener = () => void;

/**
 * Local player profiles: favorites, recently played, statistics, achievements and the save index.
 * Data lives in memory for synchronous React reads and is written through to the KeyValueStore.
 */
export class ProfileStore {
  private index: ProfilesIndex;
  private profile: ProfileData;
  private readonly listeners = new Set<Listener>();
  private writeChain: Promise<void> = Promise.resolve();

  private constructor(
    private readonly kv: KeyValueStore,
    index: ProfilesIndex,
    profile: ProfileData,
    private readonly now: () => number,
  ) {
    this.index = index;
    this.profile = profile;
  }

  static async open(kv: KeyValueStore, now: () => number = Date.now): Promise<ProfileStore> {
    const decodedIndex = unwrap(indexSpec, await kv.get(PROFILES_KEY));
    let index = decodedIndex.ok ? decodedIndex.data : null;
    let profile: ProfileData | null = null;
    if (index) {
      const decoded = unwrap(profileSpec, await kv.get(profileKey(index.activeId)));
      if (decoded.ok) profile = decoded.data;
      else console.warn(`Active profile could not be loaded (${decoded.reason}); starting fresh.`);
    }
    if (!profile) {
      profile = newProfile('Player 1', undefined, now());
      const others = index?.profiles.filter((p) => p.id !== index?.activeId) ?? [];
      index = {
        activeId: profile.id,
        profiles: [...others, { id: profile.id, name: profile.name }],
      };
      await kv.set(profileKey(profile.id), wrap(profileSpec, profile, now()));
      await kv.set(PROFILES_KEY, wrap(indexSpec, index, now()));
    }
    return new ProfileStore(kv, index!, profile, now);
  }

  getProfile = (): ProfileData => this.profile;
  getIndex = (): ProfilesIndex => this.index;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Resolves when all pending writes have reached storage. */
  flush(): Promise<void> {
    return this.writeChain;
  }

  private commit(next: ProfileData): void {
    this.profile = next;
    const snapshot = wrap(profileSpec, next, this.now());
    this.writeChain = this.writeChain
      .then(() => this.kv.set(profileKey(next.id), snapshot))
      .catch((error) => console.error('Failed to persist profile', error));
    for (const listener of this.listeners) listener();
  }

  private async commitIndex(next: ProfilesIndex): Promise<void> {
    this.index = next;
    await this.kv.set(PROFILES_KEY, wrap(indexSpec, next, this.now()));
  }

  toggleFavorite(gameId: string): void {
    const favorites = this.profile.favorites.includes(gameId)
      ? this.profile.favorites.filter((id) => id !== gameId)
      : [...this.profile.favorites, gameId];
    this.commit({ ...this.profile, favorites });
  }

  recordOpened(gameId: string): void {
    const recent = [
      { gameId, at: this.now() },
      ...this.profile.recent.filter((r) => r.gameId !== gameId),
    ].slice(0, RECENT_LIMIT);
    this.commit({ ...this.profile, recent });
  }

  recordResult(gameId: string, result: GameResult, lowerScoreIsBetter = false): GameStats {
    const now = this.now();
    const previous = this.profile.stats[gameId] ?? {
      ...emptyModeStats(),
      firstPlayed: now,
      lastPlayed: now,
      modes: {},
    };
    const overall = applyResult(previous, result, lowerScoreIsBetter);
    const modes = { ...previous.modes };
    if (result.mode)
      modes[result.mode] = applyResult(
        modes[result.mode] ?? emptyModeStats(),
        result,
        lowerScoreIsBetter,
      );
    const stats: GameStats = {
      ...overall,
      firstPlayed: previous.firstPlayed,
      lastPlayed: now,
      modes,
    };
    this.commit({ ...this.profile, stats: { ...this.profile.stats, [gameId]: stats } });
    return stats;
  }

  /** Returns true when the achievement was newly unlocked. */
  unlockAchievement(gameId: string, achievementId: string): boolean {
    const current = this.profile.achievements[gameId] ?? {};
    if (current[achievementId]) return false;
    this.commit({
      ...this.profile,
      achievements: {
        ...this.profile.achievements,
        [gameId]: { ...current, [achievementId]: this.now() },
      },
    });
    return true;
  }

  async writeSave(gameId: string, envelope: unknown): Promise<void> {
    await this.kv.set(saveKey(this.profile.id, gameId), envelope);
    this.commit({ ...this.profile, saves: { ...this.profile.saves, [gameId]: this.now() } });
  }

  readSave(gameId: string): Promise<unknown> {
    return this.kv.get(saveKey(this.profile.id, gameId));
  }

  async clearSave(gameId: string): Promise<void> {
    await this.kv.delete(saveKey(this.profile.id, gameId));
    if (gameId in this.profile.saves) {
      const saves = { ...this.profile.saves };
      delete saves[gameId];
      this.commit({ ...this.profile, saves });
    }
  }

  async renameProfile(name: string): Promise<void> {
    const trimmed = name.trim().slice(0, 24) || 'Player';
    this.commit({ ...this.profile, name: trimmed });
    await this.commitIndex({
      ...this.index,
      profiles: this.index.profiles.map((p) =>
        p.id === this.profile.id ? { ...p, name: trimmed } : p,
      ),
    });
  }

  async createProfile(name: string): Promise<void> {
    const profile = newProfile(name.trim().slice(0, 24) || 'Player', undefined, this.now());
    await this.kv.set(profileKey(profile.id), wrap(profileSpec, profile, this.now()));
    await this.commitIndex({
      activeId: profile.id,
      profiles: [...this.index.profiles, { id: profile.id, name: profile.name }],
    });
    this.profile = profile;
    for (const listener of this.listeners) listener();
  }

  async switchProfile(id: string): Promise<void> {
    if (id === this.profile.id || !this.index.profiles.some((p) => p.id === id)) return;
    const decoded = unwrap(profileSpec, await this.kv.get(profileKey(id)));
    const profile = decoded.ok
      ? decoded.data
      : newProfile(this.index.profiles.find((p) => p.id === id)?.name ?? 'Player', id, this.now());
    await this.commitIndex({ ...this.index, activeId: id });
    this.profile = profile;
    for (const listener of this.listeners) listener();
  }

  /** Deletes the active profile's progress and saves, keeping its name and id. */
  async resetProgress(): Promise<void> {
    for (const key of await this.kv.keys(`save:${this.profile.id}:`)) await this.kv.delete(key);
    this.commit({
      ...newProfile(this.profile.name, this.profile.id, this.now()),
      createdAt: this.profile.createdAt,
    });
  }
}
