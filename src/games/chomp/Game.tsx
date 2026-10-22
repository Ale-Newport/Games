import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { chompEnv } from './ai-adapter';
import { ChompBoard, squareName } from './ChompBoard';
import {
  applyChompAction,
  createChompState,
  isValidChompState,
  legalChompActions,
  replayChomp,
  SIZES,
  type ChompState,
} from './engine';
import { STRINGS } from './i18n';

const CRUNCH: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.09, gain: 0.2, lowpass: 1800 },
  { wave: 'noise', freq: 0, duration: 0.06, delay: 0.07, gain: 0.14, lowpass: 2600 },
];

const total = (s: ChompState) => s.rows.reduce((a, b) => a + b, 0);

export const CHOMP: TwoPlayerGameDefinition<ChompState, string> = {
  match: {
    rules: {
      create: (first) => createChompState(SIZES[Math.floor(Math.random() * SIZES.length)]!, first),
      restart: (s) => createChompState(s.size, s.first),
      apply: applyChompAction,
      isLegal: (s, a) => typeof a === 'string' && legalChompActions(s).includes(a),
      undo: (s, plies) => replayChomp(s.size, s.first, s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidChompState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: chompEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: ChompBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2" y="4" width="16" height="12" rx="2" fill="#6b3f22" />
      <rect
        x="2"
        y="4"
        width="16"
        height="12"
        rx="2"
        fill="none"
        stroke={seat === 0 ? '#e0473b' : '#3b7fe0'}
        strokeWidth="2.4"
      />
    </svg>
  ),
  hintAgent: 'hard',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => (s.result ? null : t('info.goal')),
  describeAction: (before, a, after, t) => {
    const [r, c] = a.split(',').map(Number) as [number, number];
    return t('announce.bite', {
      seat: t(`seat.${before.toMove}`),
      square: squareName(r, c),
      n: total(before) - total(after),
    });
  },
  actionSound: () => CRUNCH,
  describeResult: (s, t) =>
    s.result ? t('result.poison', { seat: t(`seat.${1 - s.result.winner}`) }) : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.size[0] * round.size[1] >= 42) unlock('big-bar');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CHOMP} services={services} />;
}
