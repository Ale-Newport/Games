import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { ataxxEnv } from './ai-adapter';
import { AtaxxBoard, cellName } from './AtaxxBoard';
import {
  applyAtaxxAction,
  countsOf,
  createAtaxxState,
  isValidAtaxxState,
  legalAtaxxActions,
  replayAtaxx,
  type AtaxxState,
} from './engine';
import { STRINGS } from './i18n';

const CLONE: SoundSpec = [
  { wave: 'triangle', freq: 520, freqEnd: 680, duration: 0.08, gain: 0.12 },
];
const JUMP: SoundSpec = [{ wave: 'triangle', freq: 680, freqEnd: 420, duration: 0.12, gain: 0.12 }];
const FLIP: SoundSpec = [
  { wave: 'triangle', freq: 520, freqEnd: 680, duration: 0.08, gain: 0.12 },
  { wave: 'noise', freq: 0, duration: 0.06, delay: 0.06, gain: 0.16, lowpass: 2600 },
];

const moveText = (a: string) =>
  a === 'pass'
    ? 'pass'
    : a.startsWith('+')
      ? `+${cellName(Number(a.slice(1)))}`
      : a
          .split('-')
          .map((p) => cellName(Number(p)))
          .join('→');

export const ATAXX: TwoPlayerGameDefinition<AtaxxState, string> = {
  match: {
    rules: {
      create: () => createAtaxxState(),
      apply: applyAtaxxAction,
      isLegal: (s, a) => typeof a === 'string' && legalAtaxxActions(s).includes(a),
      undo: (s, plies) => replayAtaxx(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) =>
        s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
      validate: isValidAtaxxState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    fixedFirstSeat: 0,
  },
  env: ataxxEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: AtaxxBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={seat === 0 ? '#c62f25' : '#2a63c4'}
        stroke="#fff"
        strokeWidth="1.5"
      />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  describeAction: (before, a, _after, t) =>
    t('announce.move', { seat: t(`seat.${before.toMove}`), move: moveText(a) }),
  actionSound: (after, a, mover, before) => {
    const gained = countsOf(after.board)[mover] - countsOf(before.board)[mover];
    if (gained > 1) return FLIP;
    return a.startsWith('+') ? CLONE : JUMP;
  },
  describeResult: (s, t) => {
    if (!s.result) return null;
    if (s.result.kind === 'draw' && s.result.reason === 'repetition') return t('result.repetition');
    return t('result.count', { a: s.result.counts[0], b: s.result.counts[1] });
  },
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (countsOf(round.board)[1 - setup.humanSeat] === 0) unlock('wipeout');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={ATAXX} services={services} />;
}
