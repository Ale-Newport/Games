/** Two-player shell definition builder for Go (#025–#027). */
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import type { SoundSpec } from '../../../core/audio/audio-engine';
import type { Dictionary, Locale } from '../../../core/i18n';
import { GoBoard, pointName, type PointMark } from '../goban/GoBoard';
import { GOBAN_STRINGS } from '../goban/i18n';
import { StoneIcon } from '../goban/StoneIcon';
import type { TimeControl } from '../two-player/match';
import type {
  BoardProps,
  RoundEndEvent,
  TwoPlayerGameDefinition,
} from '../two-player/TwoPlayerGame';
import { PASS, areaScore, isLegalPoint, type GoRules, type GoState } from './engine';
import { goTwoPlayerRules } from './environment';
import { GO_STRINGS } from './i18n';
import styles from './GoGame.module.css';

const CLICK: Record<0 | 1, SoundSpec> = {
  0: [
    { wave: 'noise', freq: 0, duration: 0.045, gain: 0.24, lowpass: 2600 },
    { wave: 'sine', freq: 420, freqEnd: 300, duration: 0.06, gain: 0.12 },
  ],
  1: [
    { wave: 'noise', freq: 0, duration: 0.045, gain: 0.24, lowpass: 3400 },
    { wave: 'sine', freq: 520, freqEnd: 380, duration: 0.06, gain: 0.12 },
  ],
};
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.3, lowpass: 3000 },
  { wave: 'noise', freq: 0, duration: 0.05, delay: 0.07, gain: 0.22, lowpass: 3000 },
];
const PASS_SOUND: SoundSpec = [
  { wave: 'sine', freq: 440, freqEnd: 330, duration: 0.12, gain: 0.1 },
];

export interface GoGameOptions {
  rules: GoRules;
  env: GameEnvironment<GoState, number>;
  agents: AgentPreset<GoState, number>[];
  strings: Record<Locale, Dictionary>;
  difficulties: readonly string[];
  defaultDifficulty: string;
  defaultWatch: [string, string];
  hintAgent: string;
  timeControls: readonly TimeControl[];
  onRoundEnd?: (event: RoundEndEvent<GoState>) => void;
}

export function createGoDefinition(o: GoGameOptions): TwoPlayerGameDefinition<GoState, number> {
  const { size } = o.rules;
  function Board({ state, interactive, hint, animate, t, onAction }: BoardProps<GoState, number>) {
    let marks: Map<number, PointMark> | undefined;
    if (state.result) {
      // Show the counted territory once the game is over.
      marks = new Map();
      areaScore(state.board, size).territory.forEach((owner, i) => {
        if (owner) marks!.set(i, owner === 1 ? 'territory-black' : 'territory-white');
      });
    }
    const last = state.history[state.history.length - 1];
    return (
      <div className={styles.wrap}>
        <GoBoard
          size={size}
          stones={state.board as (0 | 1 | 2)[]}
          lastMove={last !== undefined && last !== PASS ? last : null}
          hint={hint === PASS ? null : hint}
          ghost={interactive ? (state.toMove === 0 ? 1 : 2) : null}
          marks={marks}
          animate={animate}
          label={t('board.label')}
          pointLabel={(i, stone) =>
            t(stone === 0 ? 'point.empty' : stone === 1 ? 'point.black' : 'point.white', {
              point: pointName(i, size),
            })
          }
          confirmText={t('touch.confirm')}
          isPlayable={(i) => isLegalPoint(state, i)}
          onPoint={onAction}
        />
        <div className={styles.bar}>
          <button
            type="button"
            className="btn"
            disabled={!interactive}
            onClick={() => onAction(PASS)}
            data-testid="pass"
          >
            {t('action.pass')}
          </button>
          {hint === PASS && <span className={styles.hintPass}>{t('hint.pass')}</span>}
        </div>
      </div>
    );
  }
  return {
    match: {
      rules: goTwoPlayerRules(o.rules),
      difficulties: o.difficulties,
      agentIds: o.agents.map((a) => a.id),
      defaultDifficulty: o.defaultDifficulty,
      defaultWatch: o.defaultWatch,
      fixedFirstSeat: 0,
      timeControls: o.timeControls,
    },
    env: o.env,
    agents: o.agents,
    strings: {
      en: { ...GOBAN_STRINGS.en, ...GO_STRINGS.en, ...o.strings.en },
      es: { ...GOBAN_STRINGS.es, ...GO_STRINGS.es, ...o.strings.es },
    },
    Board,
    SeatIcon: StoneIcon,
    badge: `${size}×${size}`,
    wideLayout: true,
    hintAgent: o.hintAgent,
    resignable: true,
    describeAction: (before, p, _after, t) =>
      p === PASS
        ? t('announce.pass', { seat: t(`seat.${before.toMove}`) })
        : t('announce.stone', { seat: t(`seat.${before.toMove}`), point: pointName(p, size) }),
    actionSound: (after, p, mover, before) => {
      if (p === PASS) return PASS_SOUND;
      return after.captures[mover] > before.captures[mover] ? CAPTURE : CLICK[mover];
    },
    statusInfo: (s, t) =>
      t(s.passes === 1 && !s.result ? 'info.capturesPassed' : 'info.captures', {
        b: s.captures[0],
        w: s.captures[1],
        komi: o.rules.komi,
      }),
    describeResult: (s, t) =>
      s.result
        ? t('result.score', {
            b: s.result.score[0],
            w: s.result.score[1],
            komi: o.rules.komi,
          })
        : null,
    onRoundEnd: o.onRoundEnd,
  };
}
