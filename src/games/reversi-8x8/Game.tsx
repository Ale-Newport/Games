import type { GameProps } from '../../core/game-engine/types';
import { createReversiDefinition } from '../shared/reversi/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { r8Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { R8, ownsAllCorners, wipeout } from './rules';

export const REVERSI_8 = createReversiDefinition({
  rules: R8,
  env: r8Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['hard', 'medium'],
  hintAgent: 'hard',
  onRoundEnd: ({ setup, round, outcome, humanWon, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    }
    if (setup.mode === 'local') unlock('hot-seat');
    const winner = round.result?.kind === 'win' ? round.result.winner : null;
    if (humanWon && winner !== null && wipeout(round, winner)) unlock('wipeout');
    if (humanWon && winner !== null && ownsAllCorners(round, winner)) unlock('four-corners');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={REVERSI_8} services={services} />;
}
