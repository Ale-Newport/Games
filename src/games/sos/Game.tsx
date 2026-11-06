import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { sosEnv } from './ai-adapter';
import {
  applySosAction,
  createSosState,
  isValidSosState,
  legalSosActions,
  replaySos,
  type SosState,
} from './engine';
import { STRINGS } from './i18n';
import { SosBoard, cellName } from './SosBoard';

const WRITE: SoundSpec = [{ wave: 'noise', freq: 0, duration: 0.05, gain: 0.12, lowpass: 4200 }];
const SCORE: SoundSpec = [
  { wave: 'triangle', freq: 520, duration: 0.08, gain: 0.12 },
  { wave: 'triangle', freq: 780, duration: 0.12, delay: 0.07, gain: 0.12 },
];

const gained = (before: SosState, after: SosState) =>
  after.scores[0] + after.scores[1] - before.scores[0] - before.scores[1];

export const SOS: TwoPlayerGameDefinition<SosState, string> = {
  match: {
    rules: {
      create: (first) => createSosState(first),
      apply: applySosAction,
      isLegal: (s, a) => typeof a === 'string' && legalSosActions(s).includes(a),
      undo: (s, plies) => replaySos(s.first, s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => s.movers[ply] ?? (((s.first + ply) % 2) as 0 | 1),
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidSosState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: sosEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: SosBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <text
        x="10"
        y="15"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontWeight="700"
        fontSize="15"
        fill={seat === 0 ? '#e2453a' : '#2f6fd6'}
      >
        S
      </text>
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  statusInfo: (s, t) => {
    if (s.result) return null;
    const lastMover = s.movers[s.movers.length - 1];
    return lastMover === s.toMove && s.history.length > 0
      ? t('info.again', { seat: t(`seat.${s.toMove}`) })
      : t('info.goal');
  },
  describeAction: (before, a, after, t) => {
    const n = gained(before, after);
    return t(n ? 'announce.score' : 'announce.move', {
      seat: t(`seat.${before.toMove}`),
      letter: a[0]!,
      cell: cellName(Number(a.slice(1))),
      n,
    });
  },
  actionSound: (after, _a, _mover, before) => (gained(before, after) ? SCORE : WRITE),
  describeResult: (s, t) =>
    s.result ? t('result.points', { a: s.scores[0], b: s.scores[1] }) : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.scores[setup.humanSeat] >= 8) unlock('wordsmith');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={SOS} services={services} />;
}
