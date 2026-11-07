/** Computer opponents for Halma: alpha-beta on the race distance (shared jump-race evaluation). */
import { jumpRacePresets } from '../shared/jump-race/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const AGENT_PRESETS = jumpRacePresets(VARIANT, {
  easy: { depth: 1, randomness: 0.25 },
  medium: { depth: 2 },
  hard: { depth: 20, timeLimitMs: 1000 },
});
