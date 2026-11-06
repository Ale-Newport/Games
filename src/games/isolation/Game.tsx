import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { isolationEnv } from './ai-adapter';
import {
  applyIsolationAction,
  createIsolationState,
  isValidIsolationState,
  legalIsolationActions,
  moverOfPly,
  replayIsolation,
  type IsolationState,
} from './engine';
import { STRINGS } from './i18n';
import { IsolationBoard, IsolationPawn, cellName } from './IsolationBoard';

const STEP: SoundSpec = [{ wave: 'triangle', freq: 500, freqEnd: 620, duration: 0.07, gain: 0.12 }];
const REMOVE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.12, gain: 0.18, lowpass: 1400 },
  { wave: 'sine', freq: 240, freqEnd: 120, duration: 0.18, gain: 0.12 },
];

export const ISOLATION: TwoPlayerGameDefinition<IsolationState, string> = {
  match: {
    rules: {
      create: () => createIsolationState(),
      apply: applyIsolationAction,
      isLegal: (s, a) => typeof a === 'string' && legalIsolationActions(s).includes(a),
      undo: (s, plies) => replayIsolation(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => moverOfPly(ply),
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidIsolationState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    fixedFirstSeat: 0,
  },
  env: isolationEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: IsolationBoard,
  SeatIcon: ({ seat, size }) => <IsolationPawn seat={seat} size={size + 4} />,
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => (s.result ? null : t(`phase.${s.phase}`)),
  describeAction: (before, a, _after, t) =>
    t(a.startsWith('m') ? 'announce.move' : 'announce.remove', {
      seat: t(`seat.${before.toMove}`),
      cell: cellName(Number(a.slice(1))),
    }),
  actionSound: (_after, a) => (a.startsWith('m') ? STEP : REMOVE),
  describeResult: (s, t) => (s.result ? t('result.isolated') : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // Won while more than half the tiles were still on the board.
    if (round.tiles.filter(Boolean).length > 24) unlock('quick-trap');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={ISOLATION} services={services} />;
}
