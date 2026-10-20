import type { GameProps } from '../../core/game-engine/types';
import { createDraughtsDefinition } from '../shared/draughts/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { englishEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, feats } from './rules';

export const ENGLISH_CHECKERS = createDraughtsDefinition({
  variant: VARIANT,
  colors: ['dark', 'light'],
  env: englishEnv,
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
      const f = feats(round, setup.mode === 'ai' ? setup.humanSeat : null);
      if (f.crowned) unlock('crowned');
      if (f.tripleJump) unlock('triple-jump');
    }
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={ENGLISH_CHECKERS} services={services} />;
}
