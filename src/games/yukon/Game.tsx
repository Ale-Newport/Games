import type { GameProps } from '../../core/game-engine/types';
import { createColumnsDefinition } from '../shared/columns/definition';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS, yukonEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { VARIANT } from './rules';

export const YUKON_GAME = createColumnsDefinition({
  variant: VARIANT,
  columns: 7,
  firstFoundationCol: 3,
  env: yukonEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, timeMs, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (timeMs < 5 * 60_000) unlock('quick');
    if (undos === 0 && hints === 0) unlock('clean');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={YUKON_GAME} services={services} />;
}
