import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { linesOfActionEnv } from './ai-adapter';
import {
  applyLoaAction,
  cellName,
  createLoaState,
  groups,
  isValidLoaState,
  legalLoaActions,
  parseMove,
  replayLoa,
  type LoaState,
} from './engine';
import { STRINGS } from './i18n';
import { LoaBoard, LoaPiece } from './LoaBoard';

const SLIDE: SoundSpec = [{ wave: 'triangle', freq: 440, freqEnd: 520, duration: 0.07, gain: 0.1 }];
const TAKE: SoundSpec = [
  { wave: 'triangle', freq: 330, freqEnd: 220, duration: 0.08, gain: 0.12 },
  { wave: 'noise', freq: 0, duration: 0.06, delay: 0.05, gain: 0.14, lowpass: 2600 },
];

export const LINES_OF_ACTION_GAME: TwoPlayerGameDefinition<LoaState, string> = {
  match: {
    rules: {
      create: () => createLoaState(),
      apply: applyLoaAction,
      isLegal: (s, a) => typeof a === 'string' && legalLoaActions(s).includes(a),
      undo: (s, plies) => replayLoa(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidLoaState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // Black always opens.
    fixedFirstSeat: 0,
  },
  env: linesOfActionEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: LoaBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="-0.5 -0.5 1 1" aria-hidden="true">
      <LoaPiece seat={seat as 0 | 1} />
    </svg>
  ),
  wideLayout: true,
  hintAgent: 'medium',
  resignable: true,
  statusInfo: (s, t) =>
    s.result ? null : t('info.groups', { a: groups(s.board, 0), b: groups(s.board, 1) }),
  describeAction: (before, a, _after, t) => {
    const [f, to] = parseMove(a);
    const args = { seat: t(`seat.${before.toMove}`), from: cellName(f), to: cellName(to) };
    return t(before.board[to] ? 'announce.capture' : 'announce.move', args);
  },
  actionSound: (_after, a, _mover, before) => (before.board[parseMove(a)[1]] ? TAKE : SLIDE),
  describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // Won without losing a single piece.
    if (round.board.filter((x) => x === setup.humanSeat + 1).length === 12) unlock('unbroken');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={LINES_OF_ACTION_GAME} services={services} />;
}
