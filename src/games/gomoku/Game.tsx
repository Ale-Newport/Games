import type { GameProps } from '../../core/game-engine/types';
import { createStoneGame } from '../shared/goban/stone-game';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { gomokuEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { GOMOKU, winnerStoneCount } from './rules';

export const GOMOKU_GAME = createStoneGame({
  rules: GOMOKU,
  env: gomokuEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  onRoundEnd: ({ setup, round, outcome, humanWon, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    }
    if (setup.mode === 'local') unlock('hot-seat');
    if (humanWon && winnerStoneCount(round) <= 7) unlock('swift-five');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={GOMOKU_GAME} services={services} />;
}
