import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { clobberEnv } from './ai-adapter';
import { ClobberBoard, cellName } from './ClobberBoard';
import {
  applyClobberAction,
  createClobberState,
  isValidClobberState,
  legalClobberActions,
  replayClobber,
  type ClobberState,
} from './engine';
import { STRINGS } from './i18n';

const CLOBBER: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.07, gain: 0.22, lowpass: 2400 },
  { wave: 'triangle', freq: 340, freqEnd: 240, duration: 0.09, gain: 0.1 },
];

export const CLOBBER_GAME: TwoPlayerGameDefinition<ClobberState, string> = {
  match: {
    rules: {
      create: (first) => createClobberState(first),
      apply: applyClobberAction,
      isLegal: (s, a) => typeof a === 'string' && legalClobberActions(s).includes(a),
      undo: (s, plies) => replayClobber(s.first, s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidClobberState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: clobberEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: ClobberBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={seat === 0 ? '#f1ede3' : '#1c1d22'}
        stroke="#888"
        strokeWidth="1"
      />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => (s.result ? null : t('info.goal')),
  describeAction: (before, a, _after, t) => {
    const [f, to] = a.split('-').map(Number) as [number, number];
    return t('announce.move', {
      seat: t(`seat.${before.toMove}`),
      from: cellName(f),
      to: cellName(to),
    });
  },
  actionSound: () => CLOBBER,
  describeResult: (s, t) =>
    s.result ? t('result.stuck', { seat: t(`seat.${1 - s.result.winner}`) }) : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.history.length <= 14) unlock('quick-clobber');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CLOBBER_GAME} services={services} />;
}
