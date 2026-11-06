/** Computer opponents for Go 9×9 (shared Monte Carlo tree search). */
import { goPresets } from '../shared/go/environment';
import { RULES } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = goPresets(RULES, {
  easy: { playouts: 300, randomness: 0.2 },
  medium: { playouts: 2000 },
  hard: { timeLimitMs: 1000 },
  expert: { timeLimitMs: 2000 },
});
