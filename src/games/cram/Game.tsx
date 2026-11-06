import type { GameProps } from '../../core/game-engine/types';
import { createDominoDefinition } from '../shared/dominoes/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { cramEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const CRAM_GAME = createDominoDefinition({
  variant: VARIANT,
  env: cramEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // The second player moved last on a board where the first can always win.
    if (round.first !== setup.humanSeat) unlock('second-wins');
    if (round.history.length <= 11) unlock('quick-squeeze');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CRAM_GAME} services={services} />;
}
