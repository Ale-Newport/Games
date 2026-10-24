import type { SoundSpec } from '../../core/audio/audio-engine';
import type { GameProps } from '../../core/game-engine/types';
import { TwoPlayerGame, type TwoPlayerGameDefinition } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { paperSoccerEnv } from './ai-adapter';
import {
  applyPaperSoccerAction,
  createPaperSoccerState,
  isValidPaperSoccerState,
  legalPaperSoccerActions,
  replayPaperSoccer,
  type PaperSoccerState,
} from './engine';
import { STRINGS } from './i18n';
import { PaperSoccerBoard } from './PaperSoccerBoard';

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const KICK: SoundSpec = [{ wave: 'triangle', freq: 300, freqEnd: 420, duration: 0.06, gain: 0.12 }];
const BOUNCE: SoundSpec = [
  { wave: 'triangle', freq: 300, freqEnd: 420, duration: 0.06, gain: 0.12 },
  { wave: 'square', freq: 660, freqEnd: 880, duration: 0.05, delay: 0.07, gain: 0.05 },
];
const CHEER: SoundSpec = [
  { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.12 },
  { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.12, gain: 0.12 },
  { wave: 'triangle', freq: 784, duration: 0.22, delay: 0.24, gain: 0.12 },
];

export const PAPER_SOCCER_GAME: TwoPlayerGameDefinition<PaperSoccerState, string> = {
  match: {
    rules: {
      create: () => createPaperSoccerState(),
      apply: applyPaperSoccerAction,
      isLegal: (s, a) => typeof a === 'string' && legalPaperSoccerActions(s).includes(a),
      undo: (s, plies) => replayPaperSoccer(s.history.slice(0, -plies)),
      toMove: (s) => s.toMove,
      plies: (s) => s.history.length,
      moverOfPly: (s, ply) => s.movers[ply] ?? 0,
      outcome: (s) => (s.result ? { winner: s.result.winner } : null),
      validate: isValidPaperSoccerState,
    },
    difficulties: DIFFICULTIES,
    agentIds: AGENT_PRESETS.map((a) => a.id),
    defaultDifficulty: 'medium',
    defaultWatch: ['hard', 'medium'],
    // Orange kicks off; players choose their side in the menu.
    fixedFirstSeat: 0,
  },
  env: paperSoccerEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  Board: PaperSoccerBoard,
  SeatIcon: ({ seat, size }) => (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2" y="2" width="16" height="16" rx="4" fill={seat === 0 ? '#e0782b' : '#2a9d8f'} />
      <path d={seat === 0 ? 'M10 5 L14 11 H6 Z' : 'M10 15 L14 9 H6 Z'} fill="#fff" opacity="0.9" />
    </svg>
  ),
  hintAgent: 'medium',
  resignable: true,
  drawless: true,
  statusInfo: (s, t) => {
    if (s.result) return null;
    const seat = t(`seat.${s.toMove}`);
    const last = s.movers[s.movers.length - 1];
    if (last === s.toMove && s.history.length > 0) return t('info.bounce', { seat });
    return t('info.attack', { seat, goal: t(s.toMove === 0 ? 'goal.top' : 'goal.bottom') });
  },
  describeAction: (before, a, after, t) => {
    const seat = t(`seat.${before.toMove}`);
    const dir = t(`dir.${DIRS[Number(a)]!}`);
    const again = !after.result && after.toMove === before.toMove;
    return t(again ? 'announce.bounce' : 'announce.kick', { seat, dir });
  },
  actionSound: (after, _a, mover) =>
    after.result?.reason === 'goal' || after.result?.reason === 'own-goal'
      ? CHEER
      : after.toMove === mover
        ? BOUNCE
        : KICK,
  describeResult: (s, t) => (s.result ? t(`result.${s.result.reason}`) : null),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // The winning turn chained five lines or more (four bounces).
    let run = 0;
    for (let i = round.movers.length - 1; i >= 0 && round.movers[i] === setup.humanSeat; i--) run++;
    if (round.result?.reason === 'goal' && run >= 5) unlock('combo');
  },
};

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={PAPER_SOCCER_GAME} services={services} />;
}
