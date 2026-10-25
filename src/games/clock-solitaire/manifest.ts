import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'clock-solitaire',
  number: 84,
  title: { en: 'Clock', es: 'Reloj' },
  tagline: {
    en: 'Turn each card and send it to its hour — before the fourth king strikes.',
    es: 'Gira cada carta y llévala a su hora antes de que llegue el cuarto rey.',
  },
  description: {
    en: 'Thirteen face-down piles sit on a clock face, the kings in the middle. Turn a card, slip it under the pile of its hour, then turn the next card from that pile. If all four kings come up before the rest of the clock, time has run out. Pure luck — about one deal in thirteen comes out.',
    es: 'Trece montones boca abajo sobre la esfera de un reloj, con los reyes en el centro. Gira una carta, colócala bajo el montón de su hora y gira la siguiente de ese montón. Si salen los cuatro reyes antes que el resto, se acabó el tiempo. Pura suerte: sale más o menos una partida de cada trece.',
  },
  category: 'cards',
  genre: { en: 'Solitaire', es: 'Solitario' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 1,
  sessionMinutes: 3,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Face up', es: 'Boca arriba' } },
  tags: ['clock', 'solitaire', 'patience', 'cards', 'luck'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Right on Time', es: 'Puntual' },
      description: { en: 'Get the whole clock face up.', es: 'Pon todo el reloj boca arriba.' },
    },
    {
      id: 'close',
      title: { en: 'Almost Midnight', es: 'Casi medianoche' },
      description: {
        en: 'Finish with ten or more hours complete.',
        es: 'Termina con diez horas completas o más.',
      },
    },
  ],
};
