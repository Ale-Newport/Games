import type { GameProps } from '../../core/game-engine/types';
import { createMancalaDefinition } from '../shared/mancala/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { congkakEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const CONGKAK_GAME = createMancalaDefinition({
  variant: VARIANT,
  env: congkakEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.stores[setup.humanSeat] >= 60) unlock('big-store');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CONGKAK_GAME} services={services} />;
}
