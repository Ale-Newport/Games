import type { GameProps } from '../../core/game-engine/types';
import { createGravityDefinition } from '../shared/gravity/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { c5Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { C5, winningRunLength, wonDiagonally } from './rules';

export const CONNECT_FIVE = createGravityDefinition({
  rules: C5,
  env: c5Env,
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
    if (humanWon && winningRunLength(round) >= 6) unlock('six-run');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CONNECT_FIVE} services={services} />;
}
