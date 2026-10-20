import type { GameProps } from '../../core/game-engine/types';
import { createChessDefinition } from '../shared/chess/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { kothEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const KOTH_GAME = createChessDefinition({
  variant: VARIANT,
  env: kothEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  info: (s, t) => (s.result ? null : t('info.hill')),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.result?.kind === 'win' && round.result.reason === 'hill') unlock('summit');
    if (round.result?.kind === 'win' && round.result.reason === 'checkmate') unlock('old-school');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={KOTH_GAME} services={services} />;
}
