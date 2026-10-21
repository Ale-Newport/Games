import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { StoneIcon } from '../shared/goban/StoneIcon';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { pentagoEnv } from './ai-adapter';
import {
  applyPentagoAction,
  createPentagoState,
  isValidPentagoState,
  legalPentagoActions,
  replayPentago,
  type PentagoState,
} from './engine';
import { STRINGS } from './i18n';
import { PentagoBoard, cellName } from './PentagoBoard';

const PLACE: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.04, gain: 0.2, lowpass: 2600 },
  { wave: 'sine', freq: 480, freqEnd: 360, duration: 0.06, gain: 0.12 },
];
const TWIST: SoundSpec = [
  { wave: 'noise', freq: 0, duration: 0.16, gain: 0.14, lowpass: 900 },
  { wave: 'triangle', freq: 300, freqEnd: 420, duration: 0.16, gain: 0.08 },
];

const describe = (a: string) => {
  const [p, tw] = a.split(':');
  return tw
    ? `${cellName(Number(p))} ⟳${Number(tw[0]) + 1}${tw[1] === 'R' ? '↻' : '↺'}`
    : cellName(Number(p));
};

export const PENTAGO: TwoPlayerGameDefinition<PentagoState, string> = {
  match: {
    rules: {
      create: () => createPentagoState(),
      apply: applyPentagoAction,
      isLegal: (s, a) => typeof a === 'string' && legalPentagoActions(s).includes(a),
      undo: (s, plies) => replayPentago(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (_s, ply) => (ply % 2) as 0 | 1,
      outcome: (s) =>
        s.result ? { winner: s.result.kind === 'draw' ? null : s.result.winner } : null,
      validate: isValidPentagoState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // White always starts; players pick a color.
    fixedFirstSeat: 0,
  },
  env: pentagoEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: PentagoBoard,
  SeatIcon: ({ seat, size }) => <StoneIcon seat={seat === 0 ? 1 : 0} size={size} />,
  hintAgent: 'medium',
  resignable: true,
  describeAction: (before, a, _after, t) =>
    t('announce.move', { seat: t(`seat.${before.toMove}`), move: describe(a) }),
  actionSound: (_after, a) => (a.includes(':') ? TWIST : PLACE),
  describeResult: (s, t) =>
    s.result ? t(s.result.kind === 'win' ? 'result.five' : 'result.draw') : null,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const last = round.history[round.history.length - 1] ?? '';
    if (!last.includes(':')) unlock('no-twist-needed');
    if (round.history.length <= 13) unlock('quick-five');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={PENTAGO} services={services} />;
}
