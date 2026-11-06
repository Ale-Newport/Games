/** Computer opponents for English checkers (shared draughts presets, tuned levels). */
import { draughtsPresets } from '../shared/draughts/agents';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = draughtsPresets(VARIANT, {
  easy: { depth: 2, epsilon: 0.3 },
  medium: { depth: 4 },
  hard: { depth: 14, timeLimitMs: 700 },
});
