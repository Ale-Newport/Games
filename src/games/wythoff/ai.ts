/** Computer opponents for Wythoff's game (exact solver at three accuracies). */
import { heapsPresets } from '../shared/heaps/environment';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const AGENT_PRESETS = heapsPresets(VARIANT);
