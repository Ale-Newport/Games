/** Computer opponents for Domineering (alpha-beta with mobility and safe-move evaluation). */
import { dominoPresets } from '../shared/dominoes/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = dominoPresets(VARIANT, {
  easy: { depth: 1, randomness: 0.3 },
  medium: { depth: 2 },
  hard: { depth: 40, timeLimitMs: 1000 },
});
