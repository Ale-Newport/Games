/** Computer opponents for Hnefatafl (alpha-beta presets; Hard uses the fast mutable-board search). */
import { taflPresets } from '../shared/tafl/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = taflPresets(VARIANT, {
  easy: { depth: 1, randomness: 0.25 },
  medium: { depth: 2 },
  hard: { depth: 20, timeLimitMs: 1500 },
});
