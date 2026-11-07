import type { GameProps } from '../../core/game-engine/types';
import type { SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { CLOCK } from './definition';
import type { ClockState } from './engine';

const DEFINITION: SolitaireDefinition<ClockState> = {
  ...CLOCK,
  onEnd: ({ won, state, unlock }) => {
    if (state.up.filter((p) => p.length === 4).length >= 10) unlock('close');
    if (won) unlock('first-win');
  },
};

export function Game({ services }: GameProps) {
  return <SolitaireGame def={DEFINITION} services={services} />;
}
