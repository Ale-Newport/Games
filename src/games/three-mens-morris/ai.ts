/** Computer opponents for Three Men's Morris (alpha-beta with the Morris evaluation). */
import { morrisPresets } from '../shared/morris/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = morrisPresets(VARIANT, {
  easy: { depth: 2, epsilon: 0.3 },
  medium: { depth: 4 },
  hard: { depth: 16, timeLimitMs: 800 },
});
