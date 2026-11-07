/** Computer opponents for Congkak (alpha-beta presets on stores and seeds in each row). */
import { mancalaPresets } from '../shared/mancala/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = mancalaPresets(VARIANT, {
  easy: { depth: 2, randomness: 0.2 },
  medium: { depth: 3 },
  hard: { depth: 40, timeLimitMs: 1000 },
});
