import type { GameProps } from '../../core/game-engine/types';
import { createKlondikeDefinition } from '../shared/klondike/definition';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS, klondikeDraw3Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { DRAW } from './rules';

export const KLONDIKE_DRAW_3 = createKlondikeDefinition({
  draw: DRAW,
  env: klondikeDraw3Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, state, timeMs, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (timeMs < 5 * 60_000) unlock('quick');
    if (undos === 0 && hints === 0) unlock('clean');
    if (state.recycles <= 2) unlock('three-passes');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={KLONDIKE_DRAW_3} services={services} />;
}
