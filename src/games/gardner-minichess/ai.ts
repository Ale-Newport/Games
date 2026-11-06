/** Computer opponents for Gardner minichess: the shared search, deeper on the small board. */
import { chessPresets } from '../shared/chess/agents';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = chessPresets(VARIANT, {
  easy: { depth: 1, randomness: 0.3 },
  medium: { depth: 3, timeLimitMs: 400 },
  hard: { depth: 6, timeLimitMs: 900 },
  expert: { depth: 30, timeLimitMs: 1600 },
});
