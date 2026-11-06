import type { GameProps } from '../../core/game-engine/types';
import type { PointMark } from '../shared/goban/GoBoard';
import { createStoneGame } from '../shared/goban/stone-game';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { renjuEnv } from './ai-adapter';
import { isForbiddenForBlack } from './forbidden';
import { STRINGS } from './i18n';
import { RENJU, RENJU_RULES, SIZE } from './rules';

export const RENJU_GAME = createStoneGame({
  rules: RENJU,
  twoPlayerRules: RENJU_RULES,
  env: renjuEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  // Show Black's forbidden points while Black is to move.
  marks: (s) => {
    if (s.result || s.toMove !== 0 || s.history.length === 0) return undefined;
    const marks = new Map<number, PointMark>();
    for (let i = 0; i < s.board.length; i++)
      if (s.board[i] === 0 && isForbiddenForBlack(s.board, SIZE, i)) marks.set(i, 'forbidden');
    return marks;
  },
  onRoundEnd: ({ setup, outcome, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
      if (setup.humanSeat === 1) unlock('win-as-white');
    }
    if (setup.mode === 'local') unlock('hot-seat');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={RENJU_GAME} services={services} />;
}
