/** Computer opponents for Hex 7×7 (shared Monte Carlo tree search). */
import { hexPresets } from '../shared/hex/environment';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
// On 7×7 more than a second of search no longer helps (measured), so there is no Expert level.
export const AGENT_PRESETS = hexPresets({
  easy: { playouts: 300, randomness: 0.2 },
  medium: { playouts: 6000 },
  hard: { timeLimitMs: 1000 },
});
