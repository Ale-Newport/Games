import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'lunar-lander',
  number: 184,
  title: { en: 'Moon Touchdown', es: 'Alunizaje' },
  tagline: {
    en: 'Turn, burn and touch down softly on the moon — before the fuel runs out.',
    es: 'Gira, enciende el motor y posa el módulo con suavidad en la Luna antes de quedarte sin combustible.',
  },
  description: {
    en: 'A lunar landing game with an original name and look: turn the lander and fire its engine against the moon’s gravity to set it down on a flat pad — gently, upright and with little drift. Narrow pads pay ×5, wider ones ×3 and ×2; every crash costs fuel, and the run ends when the tank is dry. Arrows and Space or the touch pad, with instruments that turn green when a touchdown would be safe; watch an AI pilot.',
    es: 'Un juego de aterrizaje lunar con nombre y aspecto originales: gira el módulo y enciende su motor contra la gravedad lunar para posarlo en una plataforma llana, con suavidad, recto y sin apenas deriva. Las plataformas estrechas pagan ×5 y las anchas ×3 y ×2; cada choque cuesta combustible y la partida termina cuando el depósito se vacía. Flechas y Espacio o el panel táctil, con instrumentos que se ponen verdes cuando el alunizaje sería seguro; mira a un piloto de la IA.',
  },
  category: 'arcade',
  genre: { en: 'Arcade', es: 'Arcade' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Score', es: 'Puntos' } },
  tags: ['arcade', 'real-time', 'physics', 'space'],
  achievements: [
    {
      id: 'touchdown',
      title: { en: 'Touchdown', es: 'Alunizaje' },
      description: {
        en: 'Land safely on a pad.',
        es: 'Posa el módulo sin daños en una plataforma.',
      },
    },
    {
      id: 'five',
      title: { en: 'Pinpoint', es: 'En el blanco' },
      description: { en: 'Land on a ×5 pad.', es: 'Aluniza en una plataforma ×5.' },
    },
    {
      id: 'clean',
      title: { en: 'Clean Record', es: 'Expediente limpio' },
      description: {
        en: 'Land five times without a crash.',
        es: 'Aluniza cinco veces sin ningún choque.',
      },
    },
    {
      id: 'score',
      title: { en: 'Moon Veteran', es: 'Veterano lunar' },
      description: { en: 'Score 2000 points.', es: 'Consigue 2000 puntos.' },
    },
  ],
};
