/** Computer opponents for Fox and Geese (alpha-beta presets on the shared hunt evaluation). */
import { huntPresets } from '../shared/hunt/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = huntPresets(VARIANT, {
  easy: { depth: 2, randomness: 0.25 },
  medium: { depth: 4 },
  hard: { depth: 30, timeLimitMs: 1000 },
});
