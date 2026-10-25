import type { GameProps } from '../../core/game-engine/types';
import type { SolitaireDefinition } from '../shared/solitaire/SolitaireGame';
import { SolitaireGame } from '../shared/solitaire/SolitaireGame';
import { ACCORDION } from './definition';
import { pilesLeft, type AccordionState } from './engine';

const DEFINITION: SolitaireDefinition<AccordionState> = {
  ...ACCORDION,
  onEnd: ({ won, state, undos, hints, unlock }) => {
    // Accordion is rarely won: a short row is an achievement in itself.
    if (pilesLeft(state) <= 5) unlock('five');
    if (pilesLeft(state) <= 3) unlock('three');
    if (!won) return;
    unlock('first-win');
    if (undos === 0 && hints === 0) unlock('clean');
  },
};

export function Game({ services }: GameProps) {
  return <SolitaireGame def={DEFINITION} services={services} />;
}
