import type { GameProps } from '../../core/game-engine/types';
import { createGravityDefinition } from '../shared/gravity/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { c4Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { C4, wonDiagonally } from './rules';

export const FOUR_IN_A_ROW = createGravityDefinition({
  rules: C4,
  env: c4Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['hard', 'medium'],
  hintAgent: 'hard',
  onRoundEnd: ({ setup, round, outcome, humanWon, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty === 'medium') unlock('beat-medium');
      if (setup.difficulty === 'hard') unlock('beat-hard');
    }
    if (setup.mode === 'local') unlock('hot-seat');
    if (humanWon && wonDiagonally(round)) unlock('diagonal');
    if (round.history.length === C4.rows * C4.cols) unlock('full-board');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={FOUR_IN_A_ROW} services={services} />;
}
