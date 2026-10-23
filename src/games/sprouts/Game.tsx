import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { sproutsEnv } from './ai-adapter';
import {
  MAX_SPOTS,
  MIN_SPOTS,
  applySproutsAction,
  buildGrid,
  createSproutsState,
  curveProblem,
  isValidSproutsState,
  replaySprouts,
  type SproutsState,
} from './engine';
import { STRINGS } from './i18n';
import { SproutsBoard } from './SproutsBoard';

const PEN: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.18, gain: 0.08, lowpass: 3000 },
  { wave: 'triangle', freq: 660, freqEnd: 880, duration: 0.1, delay: 0.12, gain: 0.08 },
];

const spotIndex = (s: SproutsState, cell: number) => s.spots.findIndex((x) => x.cell === cell) + 1;

export const SPROUTS: TwoPlayerGameDefinition<SproutsState, string> = {
  match: {
    rules: {
      create: (first) =>
        createSproutsState(
          MIN_SPOTS + Math.floor(Math.random() * (MAX_SPOTS - MIN_SPOTS + 1)),
          first,
        ),
      restart: (s) => createSproutsState(s.spotCount, s.first),
      apply: applySproutsAction,
      isLegal: (s, a) =>
        typeof a === 'string' &&
        !s.result &&
        curveProblem(s, buildGrid(s), a.split('.').map(Number)) === null,
      undo: (s, plies) => replaySprouts(s.spotCount, s.first, s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidSproutsState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: sproutsEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: SproutsBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 15 C6 4 14 4 16 15"
        fill="none"
        stroke={seat === 0 ? '#d0453b' : '#2e66c9'}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="4" cy="15" r="2.4" fill="#fff" stroke="#2b2a33" strokeWidth="1" />
      <circle cx="16" cy="15" r="2.4" fill="#fff" stroke="#2b2a33" strokeWidth="1" />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => (s.result ? null : t('info.goal')),
  describeAction: (before, a, after, t) => {
    const cells = a.split('.').map(Number);
    return t('announce.curve', {
      seat: t(`seat.${before.toMove}`),
      a: spotIndex(before, cells[0]!),
      b: spotIndex(before, cells[cells.length - 1]!),
      c: after.spots.length,
    });
  },
  actionSound: () => PEN,
  describeResult: (s, t) =>
    s.result ? t('result.stuck', { seat: t(`seat.${1 - s.result.winner}`) }) : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.spotCount === MAX_SPOTS) unlock('five-spots');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={SPROUTS} services={services} />;
}
