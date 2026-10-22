import type { GameProps } from '../../core/game-engine/types';
import { createHeapsDefinition } from '../shared/heaps/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { subtractionEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const SUBTRACTION_GAME = createHeapsDefinition({
  variant: VARIANT,
  env: subtractionEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // Won after the computer moved first: the human had to take over a position from it.
    if (round.first !== setup.humanSeat) unlock('second-wins');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={SUBTRACTION_GAME} services={services} />;
}
