import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { simEnv } from './ai-adapter';
import {
  applySimAction,
  createSimState,
  isValidSimState,
  legalSimActions,
  replaySim,
  type SimState,
} from './engine';
import { STRINGS } from './i18n';
import { SimBoard, pointName } from './SimBoard';

const STROKE: Record<0 | 1, SoundSpec> = {
  0: [{ wave: 'triangle', freq: 520, freqEnd: 640, duration: 0.08, gain: 0.11 }],
  1: [{ wave: 'triangle', freq: 440, freqEnd: 560, duration: 0.08, gain: 0.11 }],
};

export const SIM: TwoPlayerGameDefinition<SimState, string> = {
  match: {
    rules: {
      create: (first) => createSimState(first),
      apply: applySimAction,
      isLegal: (s, a) => typeof a === 'string' && legalSimActions(s).includes(a),
      undo: (s, plies) => replaySim(s.first, s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidSimState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: simEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: SimBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 3 L17 16 L3 16 Z"
        fill="none"
        stroke={seat === 0 ? '#ff5a4e' : '#4ea3ff'}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  hintAgent: 'hard',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => (s.result ? null : t('info.goal')),
  describeAction: (before, a, _after, t) => {
    const [p, q] = a.split('-').map(Number) as [number, number];
    return t('announce.line', {
      seat: t(`seat.${before.toMove}`),
      a: pointName(p),
      b: pointName(q),
    });
  },
  actionSound: (_after, _a, mover) => STROKE[mover],
  describeResult: (s, t) => {
    if (!s.result) return null;
    const [a, b, c] = s.result.triangle.map(pointName) as [string, string, string];
    return t('result.triangle', { seat: t(`seat.${1 - s.result.winner}`), a, b, c });
  },
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.first === setup.humanSeat) unlock('first-mover');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={SIM} services={services} />;
}
