/** Computer opponents for janggi (shared janggi search). */
import { janggiPresets } from '../shared/xiangqi/janggi-environment';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = janggiPresets({
  easy: { depth: 1, randomness: 0.3 },
  medium: { depth: 2, timeLimitMs: 500 },
  hard: { depth: 4, timeLimitMs: 1200 },
  expert: { depth: 30, timeLimitMs: 2000 },
});
