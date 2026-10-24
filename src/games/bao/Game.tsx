import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { baoEnv } from './ai-adapter';
import { BaoBoard } from './BaoBoard';
import {
  RING,
  applyBaoAction,
  createBaoState,
  isValidBaoState,
  legalBaoActions,
  mustCapture,
  replayBao,
  type BaoState,
} from './engine';
import { STRINGS } from './i18n';

const SOW: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.12, lowpass: 3800 },
  { wave: 'noise', freq: 0, duration: 0.05, delay: 0.07, gain: 0.1, lowpass: 3800 },
  { wave: 'noise', freq: 0, duration: 0.05, delay: 0.14, gain: 0.08, lowpass: 3800 },
];
const CAPTURE: SoundSpec = [
  { wave: 'triangle', freq: 520, freqEnd: 820, duration: 0.16, gain: 0.12 },
];

const seedsOf = (s: BaoState, seat: number) =>
  s.pits.slice(seat * RING, (seat + 1) * RING).reduce((a, b) => a + b, 0);

export const BAO_GAME: TwoPlayerGameDefinition<BaoState, string> = {
  match: {
    rules: {
      create: () => createBaoState(),
      apply: applyBaoAction,
      isLegal: (s, a) => typeof a === 'string' && legalBaoActions(s).includes(a),
      undo: (s, plies) => replayBao(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidBaoState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // South always opens, as in the other mancala games.
    fixedFirstSeat: 0,
  },
  env: baoEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: BaoBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1.5" y="3.5" width="17" height="13" rx="3" fill="#5c3a1d" />
      <circle cx="6" cy={seat === 0 ? 13 : 7} r="2.4" fill="#f2ead8" />
      <circle cx="14" cy={seat === 0 ? 13 : 7} r="2.4" fill="#f2ead8" />
    </svg>
  ),
  wideLayout: true,
  hintAgent: 'medium',
  resignable: true,
  statusInfo: (s, t) => (s.result ? null : mustCapture(s) ? t('info.mustCapture') : t('info.goal')),
  describeAction: (before, a, _after, t) => {
    const i = Number(a.slice(0, -1));
    return t('announce.sow', {
      seat: t(`seat.${before.toMove}`),
      row: t(i < 8 ? 'row.front' : 'row.back'),
      n: (i % 8) + 1,
      dir: t(a.endsWith('+') ? 'dir.cw' : 'dir.ccw'),
    });
  },
  actionSound: (after, _a, mover, before) =>
    seedsOf(after, mover) > seedsOf(before, mover) ? CAPTURE : SOW,
  describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (seedsOf(round, setup.humanSeat) >= 48) unlock('harvest');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={BAO_GAME} services={services} />;
}
