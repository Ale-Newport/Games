/** Computer opponents for Hex 11×11 (shared Monte Carlo tree search). */
import { hexPresets } from '../shared/hex/environment';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = hexPresets({
  easy: { playouts: 300, randomness: 0.2 },
  medium: { playouts: 6000 },
  hard: { timeLimitMs: 1500 },
  expert: { timeLimitMs: 2500 },
});
