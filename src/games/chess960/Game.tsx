import type { GameProps } from '../../core/game-engine/types';
import { createChessDefinition } from '../shared/chess/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { chess960Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, castled, randomStart, startNumber } from './rules';

export const CHESS960_GAME = createChessDefinition({
  variant: VARIANT,
  env: chess960Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  badge: '960',
  seed: randomStart,
  info: (s, t) => t('info.start', { n: startNumber(s) }),
  onRoundEnd: ({ setup, round, outcome, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai' || outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (castled(round, setup.humanSeat)) unlock('castled-win');
    if (startNumber(round) === 518) unlock('classical');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CHESS960_GAME} services={services} />;
}
