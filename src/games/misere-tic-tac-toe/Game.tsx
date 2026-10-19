import type { GameProps } from '../../core/game-engine/types';
import { MnkGame, type MnkGameDefinition } from '../shared/mnk/MnkGame';
import { AGENT_PRESETS } from './ai';
import { misereEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { MATCH_CONFIG } from './match';
import { lostByForcedMove } from './rules';

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

export const MISERE_TIC_TAC_TOE: MnkGameDefinition = {
  match: MATCH_CONFIG,
  env: misereEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  digitKeys: NUMPAD,
  hintAgent: 'perfect',
  unbeatableDifficulty: 'perfect',
  describeResult: (s, t) => {
    if (s.result?.kind !== 'win') return t('result.noLine');
    // The line belongs to the loser: the seat that is not the winner.
    return t(s.result.winner === 0 ? 'result.lineO' : 'result.lineX');
  },
  onRoundEnd: ({ setup, round, outcome, humanWon, unlock }) => {
    if (setup.mode === 'ai' && outcome === 'win') {
      unlock('first-win');
      if (setup.difficulty === 'medium') unlock('beat-medium');
      if (setup.humanSeat === 1) unlock('win-as-o');
    }
    if (setup.mode === 'ai' && outcome === 'draw' && setup.difficulty === 'perfect')
      unlock('perfect-draw');
    if (setup.mode === 'local') unlock('hot-seat');
    if (humanWon && lostByForcedMove(round)) unlock('squeeze');
  },
};

export function Game({ services }: GameProps) {
  return <MnkGame def={MISERE_TIC_TAC_TOE} services={services} />;
}
