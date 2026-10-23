/** Computer opponents for Kalah Mancala (alpha-beta presets on stores and seeds in each row). */
import { mancalaPresets } from '../shared/mancala/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = mancalaPresets(VARIANT, {
  easy: { depth: 1, randomness: 0.25 },
  medium: { depth: 4 },
  hard: { depth: 40, timeLimitMs: 1000 },
});
