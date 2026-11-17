import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'when-and-where',
  number: 229,
  title: { en: 'When & Where', es: 'Cuándo y dónde' },
  tagline: {
    en: 'Look around an illustrated street, then pin the place and pick the year.',
    es: 'Mira una calle ilustrada, marca el lugar y elige el año.',
  },
  description: {
    en: 'Five 360° street scenes painted from clues — architecture, landmarks, terrain, the script on the signs, a flag, and the era of the cars, lamps, clothes and antennas. Drop a pin anywhere on the world map and set the year from 1850 to 2025: up to 5,000 points for each, with an optional round clock.',
    es: 'Cinco escenas callejeras en 360° pintadas a partir de pistas: arquitectura, monumentos, paisaje, la escritura de los rótulos, una bandera y la época de coches, farolas, ropa y antenas. Marca cualquier punto del mapa del mundo y ajusta el año entre 1850 y 2025: hasta 5000 puntos por cada cosa, con reloj opcional.',
  },
  category: 'viral',
  genre: { en: 'Geography & history', es: 'Geografía e historia' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 8,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points (of 50,000)', es: 'Puntos (de 50 000)' } },
  tags: ['geography', 'history', 'guessing', 'map'],
  achievements: [
    {
      id: 'bullseye',
      title: { en: 'Bullseye', es: 'En el blanco' },
      description: { en: 'Pin a scene within 50 km.', es: 'Marca una escena a menos de 50 km.' },
    },
    {
      id: 'exact-year',
      title: { en: 'Time Traveller', es: 'Viajero en el tiempo' },
      description: { en: 'Guess a year exactly.', es: 'Acierta un año exacto.' },
    },
    {
      id: 'round-9000',
      title: { en: 'Nailed It', es: 'Clavado' },
      description: { en: 'Score 9,000 in a round.', es: 'Consigue 9000 en una ronda.' },
    },
    {
      id: 'game-35000',
      title: { en: 'World Historian', es: 'Historiador del mundo' },
      description: { en: 'Score 35,000 in a game.', es: 'Consigue 35 000 en una partida.' },
    },
  ],
};
