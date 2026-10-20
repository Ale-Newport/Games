import type { GameProps } from '../../core/game-engine/types';
import { createShogiDefinition } from '../shared/shogi/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { animalEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, feats } from './rules';

export const ANIMAL_SHOGI = createShogiDefinition({
  variant: VARIANT,
  env: animalEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  badge: '3×4',
  timeControls: [
    { id: '2+2', initialMs: 2 * 60_000, incrementMs: 2_000 },
    { id: '5+3', initialMs: 5 * 60_000, incrementMs: 3_000 },
  ],
  royalName: (t) => t('royal'),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    if (feats(round, setup.humanSeat).hen) unlock('hen');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.result?.kind === 'win' && round.result.reason === 'try') unlock('home-run');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={ANIMAL_SHOGI} services={services} />;
}
