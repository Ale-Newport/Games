import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { breakthroughEnv } from './ai-adapter';
import { BreakthroughBoard, Pawn, cellName } from './BreakthroughBoard';
import {
  applyBreakthroughAction,
  createBreakthroughState,
  isValidBreakthroughState,
  legalBreakthroughActions,
  replayBreakthrough,
  type BreakthroughState,
} from './engine';
import { STRINGS } from './i18n';

const STEP: SoundSpec = [{ wave: 'triangle', freq: 420, freqEnd: 520, duration: 0.07, gain: 0.12 }];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.08, gain: 0.2, lowpass: 2200 },
  { wave: 'triangle', freq: 300, freqEnd: 200, duration: 0.1, gain: 0.12 },
];

const moveText = (before: BreakthroughState, a: string) => {
  const [f, to] = a.split('-').map(Number) as [number, number];
  return `${cellName(f)}${before.board[to] ? '×' : '–'}${cellName(to)}`;
};

export const BREAKTHROUGH: TwoPlayerGameDefinition<BreakthroughState, string> = {
  match: {
    rules: {
      create: () => createBreakthroughState(),
      apply: applyBreakthroughAction,
      isLegal: (s, a) => typeof a === 'string' && legalBreakthroughActions(s).includes(a),
      undo: (s, plies) => replayBreakthrough(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidBreakthroughState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    fixedFirstSeat: 0,
  },
  env: breakthroughEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: BreakthroughBoard,
  SeatIcon: ({ seat, size }) => <Pawn color={seat === 0 ? 1 : 2} size={size + 4} />,
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  describeAction: (before, a, _after, t) =>
    t('announce.move', { seat: t(`seat.${before.toMove}`), move: moveText(before, a) }),
  actionSound: (_after, a, _mover, before) =>
    before.board[Number(a.split('-')[1])] ? CAPTURE : STEP,
  describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const mine = setup.humanSeat + 1;
    if (round.board.filter((v) => v === mine).length === 16) unlock('untouched');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={BREAKTHROUGH} services={services} />;
}
