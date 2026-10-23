import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { yoteEnv } from './ai-adapter';
import {
  applyYoteAction,
  createYoteState,
  isValidYoteState,
  legalYoteActions,
  replayYote,
  type YoteState,
} from './engine';
import { STRINGS } from './i18n';
import { YoteBoard, squareName } from './YoteBoard';

const DROP: SoundSpec = [{ wave: 'triangle', freq: 600, freqEnd: 480, duration: 0.07, gain: 0.11 }];
const CAPTURE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.08, gain: 0.2, lowpass: 2400 },
  { wave: 'triangle', freq: 320, freqEnd: 200, duration: 0.12, gain: 0.12 },
];

const pieces = (s: YoteState) => s.board.filter(Boolean).length + s.hands[0] + s.hands[1];

export const YOTE: TwoPlayerGameDefinition<YoteState, string> = {
  match: {
    rules: {
      create: () => createYoteState(),
      apply: applyYoteAction,
      isLegal: (s, a) => typeof a === 'string' && legalYoteActions(s).includes(a),
      undo: (s, plies) => replayYote(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => s.movers[ply] ?? ((ply % 2) as 0 | 1),
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidYoteState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // Light always opens.
    fixedFirstSeat: 0,
  },
  env: yoteEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: YoteBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={seat === 0 ? '#f6efdd' : '#26221e'}
        stroke="#8d7b5c"
        strokeWidth="1.2"
      />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  statusInfo: (s, t) => (s.result ? null : t(s.bonus ? 'info.bonus' : 'info.goal')),
  describeAction: (before, a, after, t) => {
    const seat = t(`seat.${before.toMove}`);
    if (a === 'xh') return t('announce.hand', { seat });
    if (a.startsWith('x'))
      return t('announce.remove', { seat, to: squareName(Number(a.slice(1))) });
    if (a.startsWith('+')) return t('announce.place', { seat, to: squareName(Number(a.slice(1))) });
    const [f, to] = a.split('-').map(Number) as [number, number];
    const args = { seat, from: squareName(f), to: squareName(to) };
    return t(pieces(before) > pieces(after) ? 'announce.capture' : 'announce.move', args);
  },
  actionSound: (after, _a, _mover, before) => (pieces(before) > pieces(after) ? CAPTURE : DROP),
  describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const mine =
      round.hands[setup.humanSeat] + round.board.filter((x) => x === setup.humanSeat + 1).length;
    if (mine >= 8) unlock('dominant');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={YOTE} services={services} />;
}
