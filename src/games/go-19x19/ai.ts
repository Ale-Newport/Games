/** Computer opponents for Go 19×19 (shared Monte Carlo tree search). */
import { goPresets } from '../shared/go/environment';
import { RULES } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = goPresets(RULES, {
  easy: { playouts: 200, randomness: 0.2 },
  medium: { playouts: 800 },
  hard: { timeLimitMs: 2000 },
});
