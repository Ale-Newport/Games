import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { konaneEnv } from './ai-adapter';
import { KonaneBoard, cellName } from './KonaneBoard';
import {
  N,
  applyKonaneAction,
  createKonaneState,
  isValidKonaneState,
  legalKonaneActions,
  replayKonane,
  type KonaneState,
} from './engine';
import { STRINGS } from './i18n';

const JUMP: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.07, gain: 0.22, lowpass: 2400 },
  { wave: 'triangle', freq: 340, freqEnd: 240, duration: 0.09, gain: 0.1 },
];

export const KONANE_GAME: TwoPlayerGameDefinition<KonaneState, string> = {
  match: {
    rules: {
      create: () => createKonaneState(),
      apply: applyKonaneAction,
      isLegal: (s, a) => typeof a === 'string' && legalKonaneActions(s).includes(a),
      undo: (s, plies) => replayKonane(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidKonaneState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // Black always opens (the removal rules are written for the first player).
    fixedFirstSeat: 0,
  },
  env: konaneEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: KonaneBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={seat === 0 ? '#1c1a18' : '#f3e9d8'}
        stroke="#888"
        strokeWidth="1"
      />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) =>
    s.result ? null : s.history.length < 2 ? t(`phase.open${s.history.length}`) : t('info.goal'),
  describeAction: (before, a, after, t) => {
    const seat = t(`seat.${before.toMove}`);
    if (a.startsWith('x'))
      return t('announce.remove', { seat, cell: cellName(Number(a.slice(1))) });
    const [f, to] = a.split('-').map(Number) as [number, number];
    const n = before.board.filter(Boolean).length - after.board.filter(Boolean).length;
    return t('announce.jump', { seat, from: cellName(f), to: cellName(to), n });
  },
  actionSound: () => JUMP,
  describeResult: (s, t) =>
    s.result ? t('result.stuck', { seat: t(`seat.${1 - s.result.winner}`) }) : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // A double jump by the human at any point of the round.
    const double = round.history.some((a, i) => {
      if (i % 2 !== setup.humanSeat || a.startsWith('x')) return false;
      const [f, to] = a.split('-').map(Number) as [number, number];
      return Math.abs(to - f) === 4 || Math.abs(to - f) === 4 * N;
    });
    if (double) unlock('double-jump');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={KONANE_GAME} services={services} />;
}
