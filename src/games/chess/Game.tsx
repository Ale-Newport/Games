import type { GameProps } from '../../core/game-engine/types';
import { createChessDefinition } from '../shared/chess/definition';
import { TwoPlayerGame } from '../shared/two-player/TwoPlayerGame';
import { AGENT_PRESETS, DIFFICULTIES } from './ai';
import { chessEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT, feats } from './rules';

export const CHESS = createChessDefinition({
  variant: VARIANT,
  env: chessEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  difficulties: DIFFICULTIES,
  defaultDifficulty: 'medium',
  defaultWatch: ['expert', 'hard'],
  hintAgent: 'hard',
  onRoundEnd: ({ setup, round, outcome, adjudication, unlock }) => {
    if (setup.mode === 'local') unlock('hot-seat');
    if (setup.mode !== 'ai') return;
    const f = feats(round, setup.humanSeat);
    if (f.promoted) unlock('promoted');
    if (outcome !== 'win') return;
    unlock('first-win');
    if (setup.difficulty !== 'easy') unlock(`beat-${setup.difficulty}`);
    if (round.result?.kind === 'win' && round.result.reason === 'checkmate' && f.moves <= 20)
      unlock('swift-mate');
    if (setup.timeControl && setup.timeControl !== 'none' && !adjudication) unlock('on-the-clock');
  },
});

export function Game({ services }: GameProps) {
  return <TwoPlayerGame def={CHESS} services={services} />;
}
