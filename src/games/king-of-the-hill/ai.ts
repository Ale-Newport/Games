/** Computer opponents for King of the Hill (shared chess search with a king-centralization term). */
import { chessPresets, DEFAULT_CHESS_LEVELS } from '../shared/chess/agents';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = chessPresets(VARIANT, DEFAULT_CHESS_LEVELS);
