import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'tile-hopper',
  number: 187,
  title: { en: 'Cube Hopper', es: 'Saltacubos' },
  tagline: {
    en: 'Hop the pyramid, recolour every cube, and lure the spring off the edge.',
    es: 'Salta por la pirámide, cambia el color de cada cubo y engaña al muelle para que caiga.',
  },
  description: {
    en: 'An isometric pyramid-hopping game with an original name and look: hop diagonally from cube to cube to turn every top to the target colour — one landing per cube on level 1, two on level 2, and on level 3 each landing toggles. Red balls bounce down at random; a purple ball hatches into a spring that hops after you; ride a floating disc to safety and the spring may jump after you into the void. A green ball freezes everything. Arrows, or tap beside the hopper; watch an AI planner.',
    es: 'Un juego isométrico de saltar por una pirámide con nombre y aspecto originales: salta en diagonal de cubo en cubo para dejar todas las caras del color objetivo: un aterrizaje por cubo en el nivel 1, dos en el nivel 2 y en el nivel 3 cada aterrizaje lo alterna. Las bolas rojas rebotan hacia abajo al azar; una bola morada se convierte en un muelle que te persigue; sube a un disco flotante para escapar y quizá el muelle salte tras de ti al vacío. Una bola verde lo congela todo. Flechas, o toca junto al saltador; mira a una IA que planifica.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch', 'mouse'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'isometric', 'puzzle'],
  achievements: [
    {
      id: 'round',
      title: { en: 'Full Colour', es: 'Todo coloreado' },
      description: { en: 'Clear a round.', es: 'Supera una ronda.' },
    },
    {
      id: 'lure',
      title: { en: 'Off You Go', es: '¡Al vacío!' },
      description: {
        en: 'Lure the spring off the pyramid.',
        es: 'Engaña al muelle para que caiga de la pirámide.',
      },
    },
    {
      id: 'level2',
      title: { en: 'Twice Over', es: 'Por partida doble' },
      description: { en: 'Reach level 2.', es: 'Llega al nivel 2.' },
    },
    {
      id: 'score',
      title: { en: 'Pyramid Master', es: 'Maestro de la pirámide' },
      description: { en: 'Score 15 000 points.', es: 'Consigue 15 000 puntos.' },
    },
  ],
};
