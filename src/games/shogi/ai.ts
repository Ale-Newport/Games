/** Computer opponents for shogi (shared shogi search). */
import { shogiPresets } from '../shared/shogi/agents';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = shogiPresets(VARIANT, {
  easy: { depth: 1, randomness: 0.3 },
  medium: { depth: 3, timeLimitMs: 400 },
  hard: { depth: 5, timeLimitMs: 1000 },
  expert: { depth: 30, timeLimitMs: 1800 },
});
