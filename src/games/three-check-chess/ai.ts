/** Computer opponents for Three-Check (shared chess search counting checks given). */
import { chessPresets, DEFAULT_CHESS_LEVELS } from '../shared/chess/agents';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = chessPresets(VARIANT, DEFAULT_CHESS_LEVELS);
