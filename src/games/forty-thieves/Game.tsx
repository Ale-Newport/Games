import type { GameProps } from '../../core/game-engine/types';
import { createColumnsDefinition } from '../shared/columns/definition';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS, fortyThievesEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const FORTY_THIEVES_GAME = createColumnsDefinition({
  variant: VARIANT,
  columns: 10,
  firstFoundationCol: 2,
  env: fortyThievesEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, state, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (undos === 0 && hints === 0) unlock('clean');
    if (state.stock.length > 0) unlock('early');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={FORTY_THIEVES_GAME} services={services} />;
}
