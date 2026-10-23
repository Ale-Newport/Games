import type { GameProps } from '../../core/game-engine/types';
import { createTaflDefinition } from '../shared/tafl/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { tablutEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const TABLUT_GAME = createTaflDefinition({
  variant: VARIANT,
  env: tablutEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    unlock(setup.humanSeat === 1 ? 'king-escapes' : 'king-taken');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={TABLUT_GAME} services={services} />;
}
