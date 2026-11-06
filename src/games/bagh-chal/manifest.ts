import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'bagh-chal',
  number: 58,
  title: { en: 'Bagh-Chal', es: 'Bagh-Chal' },
  tagline: {
    en: 'The Nepali tiger hunt: four tigers, twenty goats, one board of lines.',
    es: 'La caza nepalí del tigre: cuatro tigres, veinte cabras y un tablero de líneas.',
  },
  description: {
    en: 'The goats are placed one at a time while four tigers prowl and jump them. Once all twenty are down, the goats move too. The tigers win by eating five goats; the goats win by leaving no tiger a move. Play either side.',
    es: 'Las cabras se colocan de una en una mientras cuatro tigres merodean y saltan sobre ellas. Cuando están las veinte, las cabras también se mueven. Los tigres ganan si se comen cinco cabras; las cabras, si no dejan ninguna jugada a los tigres. Juega con cualquier bando.',
  },
  category: 'strategy',
  genre: { en: 'Hunt game', es: 'Juego de caza' },
  players: { min: 1, max: 2 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  tags: ['bagh-chal', 'nepal', 'hunt', 'asymmetric'],
  achievements: [
    {
      id: 'first-win',
      title: { en: 'Shepherd', es: 'Pastor' },
      description: { en: 'Win against the computer.', es: 'Gana contra la CPU.' },
    },
    {
      id: 'beat-medium',
      title: { en: 'Tiger Tamer', es: 'Domador de tigres' },
      description: { en: 'Beat Medium.', es: 'Vence al nivel Medio.' },
    },
    {
      id: 'beat-hard',
      title: { en: 'Himalayan Master', es: 'Maestro del Himalaya' },
      description: { en: 'Beat Hard.', es: 'Vence al nivel Difícil.' },
    },
    {
      id: 'prey-win',
      title: { en: 'Safe Pasture', es: 'Pasto seguro' },
      description: {
        en: 'Win against the computer as the goats.',
        es: 'Gana a la CPU con las cabras.',
      },
    },
    {
      id: 'hunter-win',
      title: { en: 'Hungry Tiger', es: 'Tigre hambriento' },
      description: {
        en: 'Win against the computer as the tigers.',
        es: 'Gana a la CPU con los tigres.',
      },
    },
    {
      id: 'no-losses',
      title: { en: 'Every Goat Home', es: 'Todas a casa' },
      description: {
        en: 'Win as the goats without losing a goat.',
        es: 'Gana con las cabras sin perder ninguna.',
      },
    },
    {
      id: 'hot-seat',
      title: { en: 'Arcade Night', es: 'Noche de arcade' },
      description: { en: 'Finish a two-player game.', es: 'Termina una partida a dos jugadores.' },
    },
  ],
};
