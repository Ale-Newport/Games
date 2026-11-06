/** Computer opponents for Cram (alpha-beta with a parity estimate). */
import { dominoPresets } from '../shared/dominoes/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = dominoPresets(VARIANT, {
  easy: { depth: 1, randomness: 0.3 },
  medium: { depth: 4 },
  hard: { depth: 40, timeLimitMs: 1000 },
});
