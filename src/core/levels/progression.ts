/**
 * Shared campaign progression for games with finite level sets.
 * Completion data is stored inside each game's save; this module only encodes the unlock rules.
 */
export interface LevelRecord {
  completed: boolean;
  bestScore?: number;
  bestTimeMs?: number;
  /** 0-3 stars or similar rating, game-defined. */
  rating?: number;
}

export interface CampaignProgress {
  levels: Record<string, LevelRecord>;
}

export type UnlockRule = 'sequential' | 'all-open' | { window: number };

/** Whether level `index` (0-based, in campaign order) is playable. */
export function isLevelUnlocked(
  levelIds: readonly string[],
  index: number,
  progress: CampaignProgress,
  rule: UnlockRule = 'sequential',
): boolean {
  if (index < 0 || index >= levelIds.length) return false;
  if (rule === 'all-open' || index === 0) return true;
  const window = rule === 'sequential' ? 1 : rule.window;
  // A level unlocks once enough earlier levels are complete that it is within `window` of the frontier.
  let frontier = 0;
  while (frontier < levelIds.length && progress.levels[levelIds[frontier] as string]?.completed)
    frontier++;
  return index < frontier + window;
}

export function recordLevelResult(
  progress: CampaignProgress,
  levelId: string,
  result: LevelRecord,
): CampaignProgress {
  const previous = progress.levels[levelId];
  const merged: LevelRecord = {
    completed: (previous?.completed ?? false) || result.completed,
    bestScore: maxDefined(previous?.bestScore, result.completed ? result.bestScore : undefined),
    bestTimeMs: minDefined(previous?.bestTimeMs, result.completed ? result.bestTimeMs : undefined),
    rating: maxDefined(previous?.rating, result.completed ? result.rating : undefined),
  };
  return { levels: { ...progress.levels, [levelId]: merged } };
}

const maxDefined = (a?: number, b?: number) =>
  a === undefined ? b : b === undefined ? a : Math.max(a, b);
const minDefined = (a?: number, b?: number) =>
  a === undefined ? b : b === undefined ? a : Math.min(a, b);
