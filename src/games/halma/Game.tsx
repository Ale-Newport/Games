import type { GameProps } from '../../core/game-engine/types';
import { createJumpRaceDefinition } from '../shared/jump-race/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { halmaEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const HALMA_GAME = createJumpRaceDefinition({
  variant: VARIANT,
  env: halmaEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // A quick race: 160 plies or fewer for both sides together.
    if (round.history.length <= 160) unlock('sprint');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={HALMA_GAME} services={services} />;
}
