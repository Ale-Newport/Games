import type { GameProps } from '../../core/game-engine/types';
import { createDominoDefinition } from '../shared/dominoes/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { domineeringEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const DOMINEERING_GAME = createDominoDefinition({
  variant: VARIANT,
  env: domineeringEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (setup.humanSeat === 1) unlock('horizontal-win');
    // Few dominoes placed in all: the opponent was shut out early.
    if (round.history.length <= 20) unlock('shutout');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={DOMINEERING_GAME} services={services} />;
}
