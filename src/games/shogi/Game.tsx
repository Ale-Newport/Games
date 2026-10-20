import type { GameProps } from '../../core/game-engine/types';
import { createShogiDefinition } from '../shared/shogi/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { shogiEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, feats } from './rules';

export const SHOGI_GAME = createShogiDefinition({
  variant: VARIANT,
  env: shogiEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  royalName: (t) => t('royal'),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    const f = feats(round, setup.humanSeat);
    if (f.dragon) unlock('dragon');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (f.dropMate) unlock('drop-mate');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={SHOGI_GAME} services={services} />;
}
