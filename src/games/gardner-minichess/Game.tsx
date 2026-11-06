import type { GameProps } from '../../core/game-engine/types';
import { createChessDefinition } from '../shared/chess/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { gardnerEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const GARDNER_GAME = createChessDefinition({
  variant: VARIANT,
  env: gardnerEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  badge: '5×5',
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    if (outcome === 'draw' && setup.difficulty === 'expert') unlock('hold-expert');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    const mine = round.san.filter((_, i) => i % 2 === setup.humanSeat);
    if (round.result?.kind === 'win' && round.result.reason === 'checkmate' && mine.length <= 10)
      unlock('quick-mate');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={GARDNER_GAME} services={services} />;
}
