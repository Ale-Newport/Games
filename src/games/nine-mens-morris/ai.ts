/** Computer opponents for Nine Men's Morris (alpha-beta with the Morris evaluation). */
import { morrisPresets } from '../shared/morris/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = morrisPresets(VARIANT, {
  easy: { depth: 1, epsilon: 0.3 },
  medium: { depth: 2 },
  hard: { depth: 14, timeLimitMs: 1200 },
});
