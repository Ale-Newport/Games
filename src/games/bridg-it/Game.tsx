import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { galeEnv } from './ai-adapter';
import {
  applyGaleAction,
  createGaleState,
  isValidGaleState,
  legalGaleActions,
  replayGale,
  type GaleState,
} from './engine';
import { GaleBoard, slotName } from './GaleBoard';
import { STRINGS } from './i18n';

const BUILD: SoundSpec = [
  { wave: 'triangle', freq: 392, freqEnd: 523, duration: 0.08, gain: 0.1 },
  { wave: 'noise', freq: 0, duration: 0.04, delay: 0.06, gain: 0.08, lowpass: 3000 },
];

export const GALE_GAME: TwoPlayerGameDefinition<GaleState, string> = {
  match: {
    rules: {
      create: (first) => createGaleState(first),
      apply: applyGaleAction,
      isLegal: (s, a) => typeof a === 'string' && legalGaleActions(s).includes(a),
      undo: (s, plies) => replayGale(s.history.slice(0, -plies), s.first),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidGaleState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: galeEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: GaleBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <line
        x1={seat === 0 ? 10 : 3}
        y1={seat === 0 ? 3 : 10}
        x2={seat === 0 ? 10 : 17}
        y2={seat === 0 ? 17 : 10}
        stroke={seat === 0 ? '#e0782b' : '#2a9d8f'}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  ),
  wideLayout: true,
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => (s.result ? null : t(`info.goal.${s.toMove}`)),
  describeAction: (before, a, _after, t) =>
    t('announce.bridge', { seat: t(`seat.${before.toMove}`), slot: slotName(Number(a)) }),
  actionSound: () => BUILD,
  describeResult: (s, t) => (s.result ? t('result.connected') : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // Won after the computer opened the round.
    if (round.first !== setup.humanSeat) unlock('second-wins');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={GALE_GAME} services={services} />;
}
