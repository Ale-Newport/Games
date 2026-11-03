import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'spacewar',
  number: 192,
  title: { en: 'Star Duel', es: 'Duelo estelar' },
  tagline: {
    en: 'Two ships circle a star. Mind its pull and land five hits first.',
    es: 'Dos naves rodean una estrella. Cuidado con su gravedad y acierta cinco veces antes.',
  },
  description: {
    en: 'A two-ship space duel in the spirit of the very first computer games, with an original name and look: both ships fall towards a star in the middle and keep their momentum on a screen that wraps. Turn, burn, fire torpedoes and — when cornered — jump through hyperspace, at a risk. Fly into the star, take a torpedo or ram your rival and the round is lost; the first to five kills wins. You fly the cyan arrow against a computer duellist.',
    es: 'Un duelo espacial entre dos naves inspirado en los primeros juegos de ordenador, con nombre y aspecto originales: las dos naves caen hacia una estrella central y conservan la inercia en una pantalla que da la vuelta. Gira, enciende el motor, lanza torpedos y, si te ves acorralado, salta al hiperespacio, con riesgo. Si caes en la estrella, te alcanza un torpedo o chocas con el rival, pierdes la ronda; gana quien sume cinco bajas. Pilotas la flecha cian contra un duelista del ordenador.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: true,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'space', 'versus'],
  achievements: [
    {
      id: 'kill',
      title: { en: 'First Blood', es: 'Primera baja' },
      description: { en: 'Destroy the rival ship.', es: 'Destruye la nave rival.' },
    },
    {
      id: 'star',
      title: { en: 'Into the Fire', es: 'Al fuego' },
      description: {
        en: 'See the rival fall into the star.',
        es: 'Mira al rival caer en la estrella.',
      },
    },
    {
      id: 'match',
      title: { en: 'Ace of the Void', es: 'As del vacío' },
      description: { en: 'Win a duel.', es: 'Gana un duelo.' },
    },
    {
      id: 'flawless',
      title: { en: 'Untouched', es: 'Sin un rasguño' },
      description: { en: 'Win a duel five to nil.', es: 'Gana un duelo por cinco a cero.' },
    },
  ],
};
