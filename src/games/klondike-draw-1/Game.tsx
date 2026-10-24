import type { GameProps } from '../../core/game-engine/types';
import { createKlondikeDefinition } from '../shared/klondike/definition';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS, klondikeDraw1Env } from './ai-adapter';
import { STRINGS } from './i18n';
import { DRAW } from './rules';

export const KLONDIKE_DRAW_1 = createKlondikeDefinition({
  draw: DRAW,
  env: klondikeDraw1Env,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, state, timeMs, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (timeMs < 4 * 60_000) unlock('quick');
    if (undos === 0 && hints === 0) unlock('clean');
    if (state.recycles === 0) unlock('one-pass');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={KLONDIKE_DRAW_1} services={services} />;
}
