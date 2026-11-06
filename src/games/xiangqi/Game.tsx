import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { xiangqiTwoPlayerRules } from '../shared/xiangqi/environment';
import { positionOf, type XiangqiState } from '../shared/xiangqi/game';
import { moveAction } from '../shared/xiangqi/position';
import { createPointBoard } from '../shared/xiangqi/XiangqiBoard';
import { XiangqiPiece, XiangqiSeatIcon } from '../shared/xiangqi/XiangqiPieces';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { xiangqiEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { feats } from './rules';

const MOVE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.26, lowpass: 1900 },
  { wave: 'sine', freq: 230, freqEnd: 160, duration: 0.07, gain: 0.14 },
];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.32, lowpass: 2600 },
  { wave: 'sine', freq: 180, freqEnd: 110, duration: 0.1, gain: 0.18 },
];
const CHECK: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.24, lowpass: 2000 },
  { wave: 'triangle', freq: 880, duration: 0.14, delay: 0.03, gain: 0.16 },
];

const RESULT_KEYS: Record<string, string> = {
  repetition: 'result.repetition',
  'no-capture': 'result.noCapture',
  'no-attackers': 'result.noAttackers',
};

export const XIANGQI: TwoPlayerGameDefinition<XiangqiState, string> = {
  match: {
    rules: xiangqiTwoPlayerRules,
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['expert', 'hard'],
    fixedFirstSeat: 0,
    timeControls: [
      { id: '5+5', initialMs: 5 * 60_000, incrementMs: 5_000 },
      { id: '10+5', initialMs: 10 * 60_000, incrementMs: 5_000 },
      { id: '20+10', initialMs: 20 * 60_000, incrementMs: 10_000 },
    ],
  },
  env: xiangqiEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: createPointBoard({
    positionOf,
    moveAction,
    Piece: XiangqiPiece,
    river: true,
    pieceName: (type, side, t) =>
      t('piece.of', { side: t(`seat.${side}`).toLowerCase(), piece: t(`piece.${type}`) }),
  }),
  SeatIcon: XiangqiSeatIcon,
  wideLayout: true,
  hintAgent: 'hard',
  resignable: true,
  describeAction: (before, _a, after, t) =>
    t('announce.move', {
      seat: t(`seat.${before.toMove}`),
      move: after.notation[after.notation.length - 1] ?? '',
    }),
  actionSound: (after) => {
    if (after.checks[after.checks.length - 1]) return CHECK;
    return (after.notation[after.notation.length - 1] ?? '').includes('x') ? CAPTURE : MOVE;
  },
  statusInfo: (s, t) => (!s.result && positionOf(s).inCheck() ? t('info.check') : null),
  describeResult: (s, t) => {
    const r = s.result;
    if (!r) return null;
    if (r.kind === 'draw') return t(RESULT_KEYS[r.reason]!);
    const loser = t(`seat.${1 - r.winner}`);
    if (r.reason === 'checkmate') return t('result.checkmate');
    if (r.reason === 'stalemate') return t('result.stalemate', { seat: loser });
    return t('result.perpetual', { seat: loser });
  },
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const f = feats(round, setup.humanSeat);
    if (f.cannonMate) unlock('cannon-mate');
    if (f.horseMate) unlock('horse-mate');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={XIANGQI} services={services} />;
}
