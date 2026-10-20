import type { GameProps } from '../../core/game-engine/types';
import { createChessDefinition } from '../shared/chess/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { threeCheckEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const THREE_CHECK_GAME = createChessDefinition({
  variant: VARIANT,
  env: threeCheckEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.checks[1 - setup.humanSeat] === 0) unlock('untouchable');
    if (round.result?.kind === 'win' && round.result.reason === 'checkmate') unlock('mate-anyway');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={THREE_CHECK_GAME} services={services} />;
}
