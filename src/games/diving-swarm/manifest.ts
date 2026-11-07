import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'diving-swarm',
  number: 170,
  title: { en: 'Diving Swarm', es: 'Enjambre en picado' },
  tagline: {
    en: 'A swaying swarm that peels off in looping, firing dives.',
    es: 'Un enjambre que se balancea y se lanza en picados con bucle, disparando.',
  },
  description: {
    en: 'A fixed shooter with diving attackers, in the mould of the late-seventies swarm shooters, with original sprites: 36 fliers sway overhead, peel off in looping dives that end in a run at your ship, and commanders bring their guards. Divers score double; each cleared swarm comes back quicker.',
    es: 'Un matamarcianos con atacantes en picado, al estilo de los de finales de los setenta, con sprites originales: 36 bichos se balancean arriba, se lanzan en picados con bucle que acaban en una carrera hacia tu nave, y los comandantes bajan con su escolta. Los que bajan valen el doble; cada enjambre vuelve más rápido.',
  },
  category: 'arcade',
  genre: { en: 'Shooter', es: 'Matamarcianos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 10,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'shooter'],
  achievements: [
    {
      id: 'first',
      title: { en: 'Pilot', es: 'Piloto' },
      description: { en: 'Finish a game.', es: 'Termina una partida.' },
    },
    {
      id: 'wave',
      title: { en: 'Swarm Cleared', es: 'Enjambre despejado' },
      description: { en: 'Clear a swarm.', es: 'Despeja un enjambre.' },
    },
    {
      id: 'veteran',
      title: { en: 'Ace', es: 'As' },
      description: { en: 'Reach the fourth swarm.', es: 'Llega al cuarto enjambre.' },
    },
    {
      id: 'score',
      title: { en: 'High Score', es: 'Gran puntuación' },
      description: { en: 'Score 8000 points.', es: 'Consigue 8000 puntos.' },
    },
  ],
};
