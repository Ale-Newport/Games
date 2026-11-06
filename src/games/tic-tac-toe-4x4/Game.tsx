import type { GameProps } from '../../core/game-engine/types';
import { MnkGame, type MnkGameDefinition } from '../shared/mnk/MnkGame';
import { AGENT_PRESETS } from './ai';
import { t4Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { MATCH_CONFIG } from './match';
import { wonByDoubleThreat, wonOnDiagonal } from './rules';

export const TIC_TAC_TOE_4X4: MnkGameDefinition = {
  match: MATCH_CONFIG,
  env: t4Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  hintAgent: 'perfect',
  unbeatableDifficulty: 'perfect',
  onRoundEnd: ({ setup, round, outcome, humanWon, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty === 'medium') unlock('beat-medium');
    }
    if (setup.mode === 'ai' && outcome === 'draw' && setup.difficulty === 'perfect')
      unlock('perfect-draw');
    if (setup.mode === 'local') unlock('hot-seat');
    if (humanWon && wonByDoubleThreat(round)) unlock('double-threat');
    if (humanWon && wonOnDiagonal(round)) unlock('diagonal-win');
  },
};

export function Game({ services }: GameProps) {
  return <MnkGame def={TIC_TAC_TOE_4X4} services={services} />;
}
