/** m,n,k binding of the generic two-player match flow (src/games/shared/two-player/match.ts). */
import * as tp from '../two-player/match';
import {
  createMnkState,
  isLegalCell,
  isValidMnkState,
  other,
  playCell,
  undoMoves,
  type MnkRules,
  type MnkState,
} from './engine';

export type { MatchSetup, Mode, Scores, Speed } from '../two-player/match';
export { SPEED_MS, firstPlayerFor, markRecorded, statsMode } from '../two-player/match';
export type MatchState = tp.MatchState<MnkState>;

export interface MnkMatchConfig extends Omit<tp.MatchConfig<MnkState, number>, 'rules'> {
  rules: MnkRules;
}

export function mnkTwoPlayerRules(rules: MnkRules): tp.TwoPlayerRules<MnkState, number> {
  return {
    create: (firstPlayer) => createMnkState(rules, firstPlayer),
    apply: (s, cell) => playCell(rules, s, cell),
    isLegal: (s, cell) => isLegalCell(rules, s, cell),
    undo: (s, plies) => undoMoves(rules, s, plies),
    toMove: (s) => s.toMove,
    plies: (s) => s.history.length,
    moverOfPly: (s, ply) => (ply % 2 === 0 ? s.firstPlayer : other(s.firstPlayer)),
    outcome: (s) =>
      s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
    validate: (data): data is MnkState => isValidMnkState(rules, data),
  };
}

const configs = new WeakMap<MnkMatchConfig, tp.MatchConfig<MnkState, number>>();

export function toMatchConfig(cfg: MnkMatchConfig): tp.MatchConfig<MnkState, number> {
  let converted = configs.get(cfg);
  if (!converted) {
    converted = { ...cfg, rules: mnkTwoPlayerRules(cfg.rules) };
    configs.set(cfg, converted);
  }
  return converted;
}

export const defaultSetup = (cfg: MnkMatchConfig, playerName?: string, secondName?: string) =>
  tp.defaultSetup(toMatchConfig(cfg), playerName, secondName);
export const newMatch = (cfg: MnkMatchConfig, setup: tp.MatchSetup) =>
  tp.newMatch(toMatchConfig(cfg), setup);
export const applyMove = (cfg: MnkMatchConfig, m: MatchState, cell: number) =>
  tp.applyMove(toMatchConfig(cfg), m, cell);
export const isHumanTurn = (cfg: MnkMatchConfig, m: MatchState) =>
  tp.isHumanTurn(toMatchConfig(cfg), m);
export const canUndo = (cfg: MnkMatchConfig, m: MatchState) => tp.canUndo(toMatchConfig(cfg), m);
export const undo = (cfg: MnkMatchConfig, m: MatchState) => tp.undo(toMatchConfig(cfg), m);
export const restartRound = (cfg: MnkMatchConfig, m: MatchState) =>
  tp.restartRound(toMatchConfig(cfg), m);
export const nextRound = (cfg: MnkMatchConfig, m: MatchState) =>
  tp.nextRound(toMatchConfig(cfg), m);
export const isValidMatch = (cfg: MnkMatchConfig, data: unknown) =>
  tp.isValidMatch(toMatchConfig(cfg), data);
export const matchSaveSpec = (cfg: MnkMatchConfig) => tp.matchSaveSpec(toMatchConfig(cfg));
