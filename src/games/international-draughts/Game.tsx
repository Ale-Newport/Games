import type { GameProps } from '../../core/game-engine/types';
import { createDraughtsDefinition } from '../shared/draughts/definition';
import { draughtsFeats } from '../shared/draughts/feats';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { internationalEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const INTERNATIONAL_DRAUGHTS = createDraughtsDefinition({
  variant: VARIANT,
  colors: ['light', 'dark'],
  env: internationalEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['hard', 'medium'],
  hintAgent: 'medium',
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    }
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'watch') {
      const f = draughtsFeats(VARIANT, round, setup.mode === 'ai' ? setup.humanSeat : null);
      if (f.crowned) unlock('crowned');
      if (f.bestCapture >= 4) unlock('grand-capture');
    }
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={INTERNATIONAL_DRAUGHTS} services={services} />;
}
