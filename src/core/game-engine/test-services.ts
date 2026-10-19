/** Test-only GameServices double that records calls. Never import from application code. */
import type { GameResult, GameStats } from '../profiles/profile-store';
import { emptyModeStats } from '../profiles/profile-store';
import type { GameServices } from './types';

export interface ServiceCalls {
  results: GameResult[];
  achievements: string[];
  sounds: number;
  saves: unknown[];
}

export function createTestServices(
  overrides: Partial<GameServices> = {},
  initialSave: unknown = null,
) {
  const calls: ServiceCalls = { results: [], achievements: [], sounds: 0, saves: [] };
  let saved: unknown = initialSave;
  const services: GameServices = {
    locale: 'en',
    reducedMotion: true,
    colorblind: false,
    profileName: 'Tester',
    launchParams: {},
    playSound: () => {
      calls.sounds++;
    },
    recordResult: (result) => {
      calls.results.push(result);
      return { ...emptyModeStats(), firstPlayed: 0, lastPlayed: 0, modes: {} } satisfies GameStats;
    },
    getStats: () => undefined,
    unlockAchievement: (id) => {
      if (!calls.achievements.includes(id)) calls.achievements.push(id);
    },
    isAchievementUnlocked: (id) => calls.achievements.includes(id),
    saveSlot: <T>(spec: { validate: (d: unknown) => d is T }) => ({
      load: async () => (spec.validate(saved) ? saved : null),
      save: async (data: T) => {
        saved = structuredClone(data);
        calls.saves.push(saved);
      },
      clear: async () => {
        saved = null;
      },
    }),
    ...overrides,
  };
  return { services, calls, getSaved: () => saved };
}
