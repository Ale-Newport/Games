import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { gobbleEnv } from './ai-adapter';
import {
  applyGobbleAction,
  createGobbleState,
  isValidGobbleState,
  legalGobbleActions,
  replayGobble,
  type GobbleState,
} from './engine';
import { Cup, GobbleBoard } from './GobbleBoard';
import { STRINGS } from './i18n';

const PLACE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.05, gain: 0.2, lowpass: 1600 },
  { wave: 'sine', freq: 330, freqEnd: 250, duration: 0.08, gain: 0.12 },
];
const GOBBLE: SoundSpec = [
  { wave: 'sine', freq: 520, freqEnd: 220, duration: 0.14, gain: 0.16 },
  { wave: 'noise', freq: 0, duration: 0.05, delay: 0.1, gain: 0.18, lowpass: 1400 },
];

export const NESTING: TwoPlayerGameDefinition<GobbleState, string> = {
  match: {
    rules: {
      create: () => createGobbleState(),
      apply: applyGobbleAction,
      isLegal: (s, a) => typeof a === 'string' && legalGobbleActions(s).includes(a),
      undo: (s, plies) => replayGobble(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) =>
        s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
      validate: isValidGobbleState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    fixedFirstSeat: 0,
  },
  env: gobbleEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: GobbleBoard,
  SeatIcon: ({ seat, size }) => (
    <span style={{ display: 'grid', width: size + 6, height: size + 6 }}>
      <Cup piece={seat * 4 + 3} />
    </span>
  ),
  hintAgent: 'medium',
  resignable: true,
  describeAction: (before, a, _after, t) =>
    t('announce.move', { seat: t(`seat.${before.toMove}`), move: a }),
  actionSound: (after, a) => {
    const to = Number(a.split('>')[1]);
    return after.board[to]!.length > 1 ? GOBBLE : PLACE;
  },
  describeResult: (s, t) =>
    s.result
      ? t(
          s.result.kind === 'win'
            ? 'result.line'
            : s.result.reason === 'repetition'
              ? 'result.repetition'
              : 'result.limit',
        )
      : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const mine = round.history.filter((_, i) => i % 2 === setup.humanSeat);
    if (mine.some((a) => !a.startsWith('R'))) unlock('mover');
    if (round.reserve[setup.humanSeat][3] === 2) unlock('no-big-cups');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={NESTING} services={services} />;
}
