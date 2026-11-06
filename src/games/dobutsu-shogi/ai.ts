/** Computer opponents for animal shogi: the shared shogi search, deep on the tiny board. */
import { shogiPresets } from '../shared/shogi/agents';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = shogiPresets(VARIANT, {
  easy: { depth: 2, randomness: 0.3 },
  medium: { depth: 4, timeLimitMs: 400 },
  hard: { depth: 8, timeLimitMs: 900 },
  expert: { depth: 40, timeLimitMs: 1500 },
});
