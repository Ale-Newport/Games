/** Two-player shell definition for stone games played on the m,n,k engine (Gomoku #007, Renju #008). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import type { MnkRules, MnkState } from '../mnk/engine';
import { mnkTwoPlayerRules } from '../mnk/match';
import type { TwoPlayerRules } from '../two-player/match';
import type {
  BoardProps,
  RoundEndEvent,
  TwoPlayerGameDefinition,
} from '../two-player/TwoPlayerGame';
import { GoBoard, pointName, type PointMark } from './GoBoard';
import { GOBAN_STRINGS } from './i18n';
import { StoneIcon } from './StoneIcon';

const CLICK: Record<0 | 1, SoundSpec> = {
  0: [
    { wave: 'noise', freq: 0, duration: 0.045, gain: 0.22, lowpass: 2600 },
    { wave: 'sine', freq: 420, freqEnd: 300, duration: 0.06, gain: 0.12 },
  ],
  1: [
    { wave: 'noise', freq: 0, duration: 0.045, gain: 0.22, lowpass: 3400 },
    { wave: 'sine', freq: 520, freqEnd: 380, duration: 0.06, gain: 0.12 },
  ],
};

export interface StoneGameOptions {
  rules: MnkRules;
  /** Overrides the plain m,n,k rules (Renju adds restrictions). */
  twoPlayerRules?: TwoPlayerRules<MnkState, number>;
  env: GameEnvironment<MnkState, number>;
  agents: AgentPreset<MnkState, number>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  /** Extra point marks (e.g. Renju forbidden points for Black). */
  marks?: (state: MnkState) => ReadonlyMap<number, PointMark> | undefined;
  describeResult?: TwoPlayerGameDefinition<MnkState, number>['describeResult'];
  onRoundEnd?: (event: RoundEndEvent<MnkState>) => void;
}

export function createStoneGame(o: StoneGameOptions): TwoPlayerGameDefinition<MnkState, number> {
  const size = o.rules.cols;
  const rules = o.twoPlayerRules ?? mnkTwoPlayerRules(o.rules);
  function StoneBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
  }: BoardProps<MnkState, number>) {
    const result = state.result;
    const marks = o.marks?.(state);
    return (
      <GoBoard
        size={size}
        stones={state.board}
        lastMove={state.history.length ? state.history[state.history.length - 1]! : null}
        winLine={result?.kind === 'win' ? result.line : null}
        hint={hint}
        ghost={interactive ? (state.toMove === 0 ? 1 : 2) : null}
        marks={marks}
        animate={animate}
        label={t('board.label')}
        pointLabel={(i, stone) =>
          t(
            stone === 0
              ? marks?.get(i) === 'forbidden'
                ? 'point.forbidden'
                : 'point.empty'
              : stone === 1
                ? 'point.black'
                : 'point.white',
            {
              point: pointName(i, size),
            },
          )
        }
        confirmText={t('touch.confirm')}
        isPlayable={(i) => rules.isLegal(state, i)}
        onPoint={onAction}
      />
    );
  }
  return {
    match: {
      rules,
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      // Black always moves first in stone games: players choose a color instead of alternating.
      fixedFirstSeat: 0,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...GOBAN_STRINGS.en, ...o.strings.en },
      es: { ...GOBAN_STRINGS.es, ...o.strings.es },
    },
    Board: StoneBoard,
    SeatIcon: StoneIcon,
    badge: `${size}×${size}`,
    wideLayout: true,
    hintAgent: o.hintAgent,
    describeAction: (_before, i, after, t) =>
      t('announce.stone', {
        seat: t(after.board[i] === 1 ? 'seat.0' : 'seat.1'),
        point: pointName(i, size),
      }),
    actionSound: (_after, _i, mover) => CLICK[mover],
    describeResult: o.describeResult,
    onRoundEnd: o.onRoundEnd,
  };
}
