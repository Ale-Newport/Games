/** Tic-Tac-Toe binding of the shared m,n,k match flow (src/games/shared/mnk/match.ts). */
import * as mnk from '../shared/mnk/match';
import type { MatchSetup, MatchState, MnkMatchConfig } from '../shared/mnk/match';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { TTT } from './rules';

export type { MatchSetup, MatchState, Mode, Scores, Speed } from '../shared/mnk/match';
export { SPEED_MS, firstPlayerFor, markRecorded, statsMode } from '../shared/mnk/match';

export const MATCH_CONFIG: MnkMatchConfig = {
  rules: TTT,
  difficulties: DIFFICULTIES,
  agentIds: AGENT_PRESETS.map((a) => a.id),
  defaultDifficulty: 'medium',
  defaultWatch: ['perfect', 'medium'],
};

export const defaultSetup = (playerName?: string, secondName?: string) =>
  mnk.defaultSetup(MATCH_CONFIG, playerName, secondName);
export const newMatch = (setup: MatchSetup) => mnk.newMatch(MATCH_CONFIG, setup);
export const isHumanTurn = (m: MatchState) => mnk.isHumanTurn(MATCH_CONFIG, m);
export const canUndo = (m: MatchState) => mnk.canUndo(MATCH_CONFIG, m);
export const applyMove = (m: MatchState, cell: number) => mnk.applyMove(MATCH_CONFIG, m, cell);
export const undo = (m: MatchState) => mnk.undo(MATCH_CONFIG, m);
export const restartRound = (m: MatchState) => mnk.restartRound(MATCH_CONFIG, m);
export const nextRound = (m: MatchState) => mnk.nextRound(MATCH_CONFIG, m);
export const isValidMatch = (data: unknown) => mnk.isValidMatch(MATCH_CONFIG, data);
export const SAVE_SPEC = mnk.matchSaveSpec(MATCH_CONFIG);
