import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import {
  PASS,
  janggiMoveAction,
  janggiPositionOf,
  type JanggiState,
} from '../shared/xiangqi/janggi';
import { janggiTwoPlayerRules } from '../shared/xiangqi/janggi-environment';
import { JanggiPiece, JanggiSeatIcon } from '../shared/xiangqi/JanggiPieces';
import { createPointBoard } from '../shared/xiangqi/XiangqiBoard';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { janggiEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { feats, randomSetupSeed, setupsOf } from './rules';

const MOVE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.26, lowpass: 1700 },
  { wave: 'sine', freq: 220, freqEnd: 150, duration: 0.07, gain: 0.14 },
];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.32, lowpass: 2600 },
  { wave: 'sine', freq: 170, freqEnd: 100, duration: 0.1, gain: 0.18 },
];
const CHECK: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.24, lowpass: 2000 },
  { wave: 'triangle', freq: 820, duration: 0.14, delay: 0.03, gain: 0.16 },
];
const PASS_SOUND: SoundSpec = [
  { wave: 'sine', freq: 440, freqEnd: 330, duration: 0.12, gain: 0.1 },
];

export const JANGGI: TwoPlayerGameDefinition<JanggiState, string> = {
  match: {
    rules: janggiTwoPlayerRules(randomSetupSeed),
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['expert', 'hard'],
    fixedFirstSeat: 0,
    timeControls: [
      { id: '5+5', initialMs: 5 * 60_000, incrementMs: 5_000 },
      { id: '10+10', initialMs: 10 * 60_000, incrementMs: 10_000 },
    ],
  },
  env: janggiEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: createPointBoard({
    positionOf: janggiPositionOf,
    moveAction: janggiMoveAction,
    Piece: JanggiPiece,
    river: false,
    passAction: PASS,
    pieceName: (type, side, t) =>
      t('piece.of', { side: t(`seat.${side}`), piece: t(`piece.${type}`) }),
  }),
  SeatIcon: JanggiSeatIcon,
  wideLayout: true,
  hintAgent: 'hard',
  resignable: true,
  describeAction: (before, _a, after, t) =>
    t('announce.move', {
      seat: t(`seat.${before.toMove}`),
      move: after.notation[after.notation.length - 1] ?? '',
    }),
  actionSound: (after, action) => {
    if (action === PASS) return PASS_SOUND;
    if (after.checks[after.checks.length - 1]) return CHECK;
    return (after.notation[after.notation.length - 1] ?? '').includes('x') ? CAPTURE : MOVE;
  },
  statusInfo: (s, t) => {
    const [cho, han] = setupsOf(s).map((o) => [...o].map((x) => t(`setup.${x}`)).join(''));
    const parts = [t('info.setup', { cho: cho!, han: han! })];
    if (!s.result) {
      const pos = janggiPositionOf(s);
      if (pos.inCheck()) parts.push(t('info.check'));
      else if (pos.bikjang()) parts.push(t('info.bikjang'));
    }
    return parts.join(' · ');
  },
  describeResult: (s, t) => {
    const r = s.result;
    if (!r) return null;
    if (r.kind === 'draw') return t('result.repetition');
    if (r.reason === 'checkmate') return t('result.checkmate');
    if (r.reason === 'points') return t('result.points', { a: r.points![0], b: r.points![1] });
    return t('result.perpetual', { seat: t(`seat.${1 - r.winner}`) });
  },
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const f = feats(round, setup.humanSeat);
    if (f.cannonMate) unlock('cannon-mate');
    if (f.pointsWin) unlock('on-points');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={JANGGI} services={services} />;
}
