import type { GameProps } from '../../core/game-engine/types';
import { createHuntDefinition } from '../shared/hunt/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { foxAndGeeseEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const FOX_AND_GEESE_GAME = createHuntDefinition({
  variant: VARIANT,
  tiger: false,
  env: foxAndGeeseEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    unlock(setup.humanSeat === 0 ? 'prey-win' : 'hunter-win');
    if (setup.humanSeat === 0 && round.captured === 0) unlock('no-losses');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={FOX_AND_GEESE_GAME} services={services} />;
}
