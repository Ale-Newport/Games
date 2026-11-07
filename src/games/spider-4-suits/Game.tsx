import type { GameProps } from '../../core/game-engine/types';
import { createSpiderDefinition } from '../shared/spider/definition';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { AGENT_PRESETS, spiderEnv } from './ai-adapter';
import { STRINGS } from './i18n';
import { SUITS } from './rules';

export const SPIDER = createSpiderDefinition({
  suits: SUITS,
  env: spiderEnv,
  agents: AGENT_PRESETS,
  strings: STRINGS,
  onEnd: ({ won, state, timeMs, undos, hints, unlock }) => {
    if (!won) return;
    unlock('first-win');
    if (timeMs < 20 * 60_000) unlock('quick');
    if (undos === 0 && hints === 0) unlock('clean');
    if (state.score >= 1000) unlock('high-score');
  },
});

export function Game({ services }: GameProps) {
  return <SolitaireGame def={SPIDER} services={services} />;
}
