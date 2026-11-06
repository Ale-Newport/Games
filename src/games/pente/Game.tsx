import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { GoBoard, pointName, type PointMark } from '../shared/goban/GoBoard';
import { GOBAN_STRINGS } from '../shared/goban/i18n';
import { StoneIcon } from '../shared/goban/StoneIcon';
import {
  TwoPlayerGame,
  type BoardProps,
  type TwoPlayerGameDefinition,
} from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { penteEnv } from './ai-adapter';
import { SIZE, isLegal, type PenteState } from './engine';
import { STRINGS } from './i18n';
import { PENTE_RULES, hadDoubleCapture, wonByCaptures } from './rules';

const CLICK: SoundSpec = [{ wave: 'noise', freq: 0, duration: 0.045, gain: 0.22, lowpass: 3000 }];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.25, lowpass: 3000 },
  { wave: 'triangle', freq: 700, freqEnd: 1100, duration: 0.16, delay: 0.05, gain: 0.18 },
];

function PenteBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
}: BoardProps<PenteState, number>) {
  const marks = new Map<number, PointMark>();
  for (const i of state.lastCaptured) marks.set(i, 'capture');
  // Tournament rule: show the points the first player may not use for the second stone.
  const blocked =
    !state.result && state.history.length === 2
      ? new Set(state.board.flatMap((v, i) => (v === 0 && !isLegal(state, i) ? [i] : [])))
      : null;
  if (blocked && interactive) for (const i of blocked) marks.set(i, 'forbidden');
  const result = state.result;
  return (
    <GoBoard
      size={SIZE}
      stones={state.board}
      lastMove={state.history.length ? state.history[state.history.length - 1]! : null}
      winLine={result?.kind === 'win' && result.reason === 'five' ? result.line : null}
      hint={hint}
      ghost={interactive ? (state.toMove === 0 ? 1 : 2) : null}
      marks={marks}
      animate={animate}
      label={t('board.label')}
      pointLabel={(i, stone) =>
        t(
          stone === 0
            ? blocked?.has(i)
              ? 'point.blocked'
              : 'point.empty'
            : stone === 1
              ? 'point.black'
              : 'point.white',
          { point: pointName(i, SIZE) },
        )
      }
      confirmText={t('touch.confirm')}
      isPlayable={(i) => isLegal(state, i)}
      onPoint={onAction}
    />
  );
}

export const PENTE: TwoPlayerGameDefinition<PenteState, number> = {
  match: {
    rules: PENTE_RULES,
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    fixedFirstSeat: 0,
  },
  env: penteEnv,
  agents: AGENT_PRESETS,
  strings: {
    en: { ...GOBAN_STRINGS.en, ...STRINGS.en },
    es: { ...GOBAN_STRINGS.es, ...STRINGS.es },
  },
  Board: PenteBoard,
  SeatIcon: StoneIcon,
  badge: '19×19',
  wideLayout: true,
  hintAgent: 'medium',
  describeAction: (_before, i, after, t) => {
    const seat = t(after.board[i] === 1 ? 'seat.0' : 'seat.1');
    const pairs = after.lastCaptured.length / 2;
    return pairs
      ? t('announce.capture', { seat, point: pointName(i, SIZE), n: pairs })
      : t('announce.stone', { seat, point: pointName(i, SIZE) });
  },
  actionSound: (after) => (after.lastCaptured.length ? CAPTURE : CLICK),
  statusInfo: (s, t) => t('info.captures', { b: s.captures[0], w: s.captures[1] }),
  describeResult: (s, t) =>
    s.result?.kind === 'win'
      ? t(s.result.reason === 'captures' ? 'result.byCaptures' : 'result.byFive', {
          seat: t(`seat.${s.result.winner}`),
        })
      : null,
  onRoundEnd: ({ setup, round, outcome, humanWon, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    }
    if (setup.mode === 'local') unlock('hot-seat');
    if (humanWon && wonByCaptures(round)) unlock('capture-win');
    if (hadDoubleCapture(round, setup.mode === 'ai' ? setup.humanSeat : null))
      unlock('double-capture');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={PENTE} services={services} />;
}
