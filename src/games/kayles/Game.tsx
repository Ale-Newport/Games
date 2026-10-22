import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { kaylesEnv } from './ai-adapter';
import {
  MAX_PINS,
  MIN_PINS,
  applyKaylesAction,
  createKaylesState,
  isValidKaylesState,
  legalKaylesActions,
  replayKayles,
  type KaylesState,
} from './engine';
import { STRINGS } from './i18n';
import { KaylesBoard } from './KaylesBoard';

const KNOCK: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.06, gain: 0.22, lowpass: 3000 },
  { wave: 'triangle', freq: 300, freqEnd: 180, duration: 0.14, delay: 0.03, gain: 0.12 },
];

export const KAYLES: TwoPlayerGameDefinition<KaylesState, string> = {
  match: {
    rules: {
      create: (first) =>
        createKaylesState(MIN_PINS + Math.floor(Math.random() * (MAX_PINS - MIN_PINS + 1)), first),
      restart: (s) => createKaylesState(s.pins.length, s.first),
      apply: applyKaylesAction,
      isLegal: (s, a) => typeof a === 'string' && legalKaylesActions(s).includes(a),
      undo: (s, plies) => replayKayles(s.pins.length, s.first, s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => ((s.first + ply) % 2) as 0 | 1,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidKaylesState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
  },
  env: kaylesEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: KaylesBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill={seat === 0 ? '#d6453a' : '#2f6fd6'} />
      <circle cx="7.5" cy="8" r="1.4" fill="#fff" />
      <circle cx="12.5" cy="8" r="1.4" fill="#fff" />
      <circle cx="10" cy="12.5" r="1.4" fill="#fff" />
    </svg>
  ),
  hintAgent: 'hard',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => (s.result ? null : t('info.goal')),
  describeAction: (before, a, _after, t) => {
    const [i, j] = a.split('-').map(Number) as [number, number | undefined];
    return j === undefined
      ? t('announce.one', { seat: t(`seat.${before.toMove}`), a: i + 1 })
      : t('announce.two', { seat: t(`seat.${before.toMove}`), a: i + 1, b: j + 1 });
  },
  actionSound: () => KNOCK,
  describeResult: (s, t) =>
    s.result ? t('result.last', { seat: t(`seat.${s.result.winner}`) }) : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.pins.length === MAX_PINS) unlock('full-lane');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={KAYLES} services={services} />;
}
