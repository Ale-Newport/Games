import type { GameProps } from '../../core/game-engine/types';
import { createMorrisDefinition } from '../shared/morris/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { threeEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const THREE_MENS_GAME = createMorrisDefinition({
  variant: VARIANT,
  env: threeEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['hard', 'medium'],
  hintAgent: 'medium',
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.history.length <= 7) unlock('quick-line');
    if (round.history.length > 6) unlock('slide-win');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={THREE_MENS_GAME} services={services} />;
}
