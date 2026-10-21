import type { GameProps } from '../../core/game-engine/types';
import { createMorrisDefinition } from '../shared/morris/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { nineEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, feats } from './rules';

export const NINE_MENS_GAME = createMorrisDefinition({
  variant: VARIANT,
  env: nineEnv,
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
    const f = feats(round, setup.humanSeat);
    if (f.pieces === VARIANT.pieces) unlock('flawless');
    if (f.mills >= 5) unlock('miller');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={NINE_MENS_GAME} services={services} />;
}
