import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { teekoEnv } from './ai-adapter';
import {
  applyTeekoAction,
  createTeekoState,
  isValidTeekoState,
  legalTeekoActions,
  replayTeeko,
  type TeekoState,
} from './engine';
import { STRINGS } from './i18n';
import { TeekoBoard, cellName } from './TeekoBoard';

const TAP: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.2, lowpass: 2200 },
  { wave: 'sine', freq: 380, freqEnd: 300, duration: 0.06, gain: 0.12 },
];

const moveText = (a: string) =>
  a
    .split('-')
    .map((p) => cellName(Number(p)))
    .join('–');

export const TEEKO: TwoPlayerGameDefinition<TeekoState, string> = {
  match: {
    rules: {
      create: () => createTeekoState(),
      apply: applyTeekoAction,
      isLegal: (s, a) => typeof a === 'string' && legalTeekoActions(s).includes(a),
      undo: (s, plies) => replayTeeko(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) =>
        s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
      validate: isValidTeekoState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    fixedFirstSeat: 0,
  },
  env: teekoEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: TeekoBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={seat === 0 ? '#1a1a1a' : '#b3261e'}
        stroke="#fff"
        strokeWidth="1.5"
      />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  describeAction: (before, a, _after, t) =>
    t('announce.move', { seat: t(`seat.${before.toMove}`), move: moveText(a) }),
  actionSound: () => TAP,
  describeResult: (s, t) =>
    s.result
      ? t(
          s.result.kind === 'win'
            ? 'result.shape'
            : s.result.reason === 'repetition'
              ? 'result.repetition'
              : 'result.limit',
        )
      : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    if (outcome === 'draw' && setup.difficulty === 'hard') unlock('hold-hard');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.history.length <= 8) unlock('drop-win');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={TEEKO} services={services} />;
}
