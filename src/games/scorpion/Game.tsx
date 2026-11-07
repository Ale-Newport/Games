import type { GameProps } from '../../core/game-engine/types';
import { createColumnsDefinition } from '../shared/columns/definition';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS, scorpionEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const SCORPION_GAME = createColumnsDefinition({
  variant: VARIANT,
  columns: 7,
  firstFoundationCol: 3,
  env: scorpionEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, state, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (undos === 0 && hints === 0) unlock('clean');
    if (!state.history.includes('deal')) unlock('no-reserve');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={SCORPION_GAME} services={services} />;
}
