import type { GameProps } from '../../core/game-engine/types';
import { MnkGame, type MnkGameDefinition } from '../shared/mnk/MnkGame';
import { AGENT_PRESETS } from './ai';
import { tttEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { MATCH_CONFIG } from './match';
import { winnerMarkCount, wonByFork } from './rules';

/** Numeric-keypad layout: 7 8 9 is the top row. */
const NUMPAD: Record<string, number> = {
  '7': 0,
  '8': 1,
  '9': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '1': 6,
  '2': 7,
  '3': 8,
};

export const TIC_TAC_TOE: MnkGameDefinition = {
  match: MATCH_CONFIG,
  env: tttEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  digitKeys: NUMPAD,
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
    if (humanWon && wonByFork(round)) unlock('fork-master');
    if (humanWon && winnerMarkCount(round) === 3) unlock('three-move-win');
  },
};

export function Game({ services }: GameProps) {
  return <MnkGame def={TIC_TAC_TOE} services={services} />;
}
