import type { GameProps } from '../../core/game-engine/types';
import { createHexDefinition } from '../shared/hex/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { hex11Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { SIZE, feats } from './rules';

export const HEX_11 = createHexDefinition({
  size: SIZE,
  env: hex11Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'medium',
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const f = feats(round, setup.humanSeat);
    if (f.stones <= 13) unlock('short-path');
    if (f.swapped && setup.humanSeat === 1) unlock('swap-win');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={HEX_11} services={services} />;
}
