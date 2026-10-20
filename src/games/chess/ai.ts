/** Computer opponents for standard chess (shared chess search, default levels). */
import { chessPresets, DEFAULT_CHESS_LEVELS } from '../shared/chess/agents';
import { VARIANT } from './rules';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export const AGENT_PRESETS = chessPresets(VARIANT, DEFAULT_CHESS_LEVELS);
