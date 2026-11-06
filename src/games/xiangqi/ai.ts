/** Computer opponents for xiangqi (shared xiangqi search). */
import { xiangqiPresets } from '../shared/xiangqi/environment';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = xiangqiPresets({
  easy: { depth: 1, randomness: 0.3 },
  medium: { depth: 3, timeLimitMs: 400 },
  hard: { depth: 5, timeLimitMs: 1000 },
  expert: { depth: 30, timeLimitMs: 1800 },
});
