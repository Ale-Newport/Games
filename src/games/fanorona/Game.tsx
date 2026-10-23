import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { fanoronaEnv } from './ai-adapter';
import {
  applyFanoronaAction,
  createFanoronaState,
  isValidFanoronaState,
  legalFanoronaActions,
  replayFanorona,
  type FanoronaState,
} from './engine';
import { FanoronaBoard, pointName } from './FanoronaBoard';
import { STRINGS } from './i18n';

const STEP: SoundSpec = [{ wave: 'triangle', freq: 460, freqEnd: 560, duration: 0.07, gain: 0.1 }];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.08, gain: 0.2, lowpass: 2600 },
  { wave: 'triangle', freq: 340, freqEnd: 220, duration: 0.12, gain: 0.12 },
];

const pieces = (s: FanoronaState) => s.board.filter(Boolean).length;

export const FANORONA: TwoPlayerGameDefinition<FanoronaState, string> = {
  match: {
    rules: {
      create: () => createFanoronaState(),
      apply: applyFanoronaAction,
      isLegal: (s, a) => typeof a === 'string' && legalFanoronaActions(s).includes(a),
      undo: (s, plies) => replayFanorona(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => s.movers[ply] ?? ((ply % 2) as 0 | 1),
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidFanoronaState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // White always opens.
    fixedFirstSeat: 0,
  },
  env: fanoronaEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: FanoronaBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={seat === 0 ? '#fbf6ea' : '#2a2420'}
        stroke="#8d7b5c"
        strokeWidth="1.2"
      />
    </svg>
  ),
  wideLayout: true,
  hintAgent: 'medium',
  resignable: true,
  statusInfo: (s, t) => {
    if (s.result) return null;
    if (s.chain) return t('info.chain');
    return legalFanoronaActions(s).some((a) => /[AW]$/.test(a))
      ? t('info.mustCapture')
      : t('info.goal');
  },
  describeAction: (before, a, after, t) => {
    const seat = t(`seat.${before.toMove}`);
    if (a === 'stop') return t('announce.stop', { seat });
    const [f, to] = a.replace(/[AW]$/, '').split('-').map(Number) as [number, number];
    const n = pieces(before) - pieces(after);
    return n
      ? t('announce.capture', { seat, from: pointName(f), to: pointName(to), n })
      : t('announce.move', { seat, from: pointName(f), to: pointName(to) });
  },
  actionSound: (after, _a, _mover, before) => (pieces(before) > pieces(after) ? CAPTURE : STEP),
  describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.board.filter((v) => v === setup.humanSeat + 1).length >= 10) unlock('dominant');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={FANORONA} services={services} />;
}
