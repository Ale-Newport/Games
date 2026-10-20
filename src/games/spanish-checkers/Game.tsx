import type { GameProps } from '../../core/game-engine/types';
import { createDraughtsDefinition } from '../shared/draughts/definition';
import { draughtsFeats } from '../shared/draughts/feats';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { spanishEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, capturedAKing } from './rules';

export const SPANISH_CHECKERS = createDraughtsDefinition({
  variant: VARIANT,
  colors: ['light', 'dark'],
  env: spanishEnv,
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
      const seat = setup.mode === 'ai' ? setup.humanSeat : null;
      if (draughtsFeats(VARIANT, round, seat).crowned) unlock('crowned');
      if (capturedAKing(round, seat)) unlock('king-hunter');
    }
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={SPANISH_CHECKERS} services={services} />;
}
