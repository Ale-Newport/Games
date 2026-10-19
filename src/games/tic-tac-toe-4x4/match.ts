/** Tic-Tac-Toe 4×4 binding of the shared m,n,k match flow. */
import { matchSaveSpec, type MnkMatchConfig } from '../shared/mnk/match';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { T4 } from './rules';

export const MATCH_CONFIG: MnkMatchConfig = {
  rules: T4,
  difficulties: DIFFICULTIES,
  agentIds: AGENT_PRESETS.map((a) => a.id),
  defaultDifficulty: 'medium',
  defaultWatch: ['perfect', 'medium'],
};

export const SAVE_SPEC = matchSaveSpec(MATCH_CONFIG);
