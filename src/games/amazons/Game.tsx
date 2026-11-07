import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES, reachCounts } from './ai';
import { amazonsEnv } from './ai-adapter';
import { AmazonPiece, AmazonsBoard } from './AmazonsBoard';
import {
  applyAmazonsAction,
  cellName,
  createAmazonsState,
  isValidAmazonsState,
  legalAmazonsActions,
  parseMove,
  replayAmazons,
  type AmazonsState,
} from './engine';
import { STRINGS } from './i18n';

const SHOT: SoundSpec = [
  { wave: 'triangle', freq: 420, freqEnd: 520, duration: 0.06, gain: 0.08 },
  { wave: 'noise', freq: 0, duration: 0.09, delay: 0.08, gain: 0.14, lowpass: 3200 },
];

export const AMAZONS_GAME: TwoPlayerGameDefinition<AmazonsState, string> = {
  match: {
    rules: {
      create: (first) => createAmazonsState(first),
      apply: applyAmazonsAction,
      isLegal: (s, a) => typeof a === 'string' && legalAmazonsActions(s).includes(a),
      undo: (s, plies) => replayAmazons(s.history.slice(0, -plies), s.first),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidAmazonsState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: amazonsEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: AmazonsBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="-0.5 -0.5 1 1" aria-hidden="true">
      <AmazonPiece seat={seat as 0 | 1} />
    </svg>
  ),
  wideLayout: true,
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => {
    if (s.result) return null;
    const [a, b] = reachCounts(s.board);
    return t('info.goal', { a, b });
  },
  describeAction: (before, a, _after, t) => {
    const [f, to, x] = parseMove(a);
    return t('announce.turn', {
      seat: t(`seat.${before.toMove}`),
      from: cellName(f),
      to: cellName(to),
      arrow: cellName(x),
    });
  },
  actionSound: () => SHOT,
  describeResult: (s, t) => (s.result ? t('result.stuck') : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // Won with at least 20 squares still reachable by the human's amazons.
    if (reachCounts(round.board)[setup.humanSeat] >= 20) unlock('landslide');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={AMAZONS_GAME} services={services} />;
}
