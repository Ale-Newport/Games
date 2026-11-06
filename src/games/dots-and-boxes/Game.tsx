import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { dotsEnv } from './ai-adapter';
import { DotsBoard, lineName } from './DotsBoard';
import {
  applyDotsAction,
  createDotsState,
  isValidDotsState,
  legalDotsActions,
  replayDots,
  type DotsState,
} from './engine';
import { STRINGS } from './i18n';

const LINE: SoundSpec = [{ wave: 'triangle', freq: 640, freqEnd: 560, duration: 0.06, gain: 0.1 }];
const BOX: SoundSpec = [
  { wave: 'triangle', freq: 520, duration: 0.08, gain: 0.12 },
  { wave: 'triangle', freq: 780, duration: 0.12, delay: 0.07, gain: 0.12 },
];

const closed = (before: DotsState, after: DotsState) =>
  after.scores[0] + after.scores[1] > before.scores[0] + before.scores[1];

export const DOTS: TwoPlayerGameDefinition<DotsState, number> = {
  match: {
    rules: {
      create: () => createDotsState(),
      apply: applyDotsAction,
      isLegal: (s, a) => typeof a === 'number' && legalDotsActions(s).includes(a),
      undo: (s, plies) => replayDots(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => s.movers[ply] ?? ((ply % 2) as 0 | 1),
      outcome: (s) => (s.result ? { winner: 'draw' in s.result ? null : s.result.winner } : null),
      validate: isValidDotsState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    fixedFirstSeat: 0,
  },
  env: dotsEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: DotsBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="2"
        fill={seat === 0 ? '#e0572b' : '#2b6fd6'}
        opacity="0.35"
      />
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="2"
        fill="none"
        stroke={seat === 0 ? '#e0572b' : '#2b6fd6'}
        strokeWidth="2.2"
      />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  statusInfo: (s, t) => {
    const lastMover = s.movers[s.movers.length - 1];
    // The same player moving twice in a row means a box was just closed.
    return !s.result && lastMover === s.toMove && s.history.length > 0
      ? t('info.again', { seat: t(`seat.${s.toMove}`) })
      : null;
  },
  describeAction: (before, a, after, t) =>
    t(closed(before, after) ? 'announce.box' : 'announce.move', {
      seat: t(`seat.${before.toMove}`),
      line: lineName(a),
    }),
  actionSound: (after, _a, _mover, before) => (closed(before, after) ? BOX : LINE),
  describeResult: (s, t) =>
    s.result ? t('result.boxes', { a: s.scores[0], b: s.scores[1] }) : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.scores[setup.humanSeat] >= 12) unlock('landslide');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={DOTS} services={services} />;
}
