/** Misère Tic-Tac-Toe binding of the shared m,n,k match flow. */
import { matchSaveSpec, type MnkMatchConfig } from '../shared/mnk/match';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { MISERE } from './rules';

export const MATCH_CONFIG: MnkMatchConfig = {
  rules: MISERE,
  difficulties: DIFFICULTIES,
  agentIds: AGENT_PRESETS.map((a) => a.id),
  defaultDifficulty: 'medium',
  defaultWatch: ['perfect', 'medium'],
};

export const SAVE_SPEC = matchSaveSpec(MATCH_CONFIG);
