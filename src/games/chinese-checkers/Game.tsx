import type { GameProps } from '../../core/game-engine/types';
import { createJumpRaceDefinition } from '../shared/jump-race/definition';
import { jumpPath, parseMove } from '../shared/jump-race/engine';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { chineseCheckersEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const CHINESE_CHECKERS_GAME = createJumpRaceDefinition({
  variant: VARIANT,
  env: chineseCheckersEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    // A chain of four jumps or more by the human at any point of the round.
    let s = CHINESE_CHECKERS_GAME.match.rules.create(round.first);
    let long = false;
    for (const a of round.history) {
      const [f, t] = parseMove(a);
      if (s.toMove === setup.humanSeat && jumpPath(VARIANT, s.board, f, t).length >= 5) long = true;
      s = CHINESE_CHECKERS_GAME.match.rules.apply(s, a);
    }
    if (long) unlock('long-hop');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CHINESE_CHECKERS_GAME} services={services} />;
}
